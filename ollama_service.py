"""
Lumen Support AI — LLM Service (Ollama)
All LLM calls go through this service. No raw httpx calls elsewhere.

Model routing rationale:
- phi3:mini → classification: Fast, good at JSON, small context needed
- llama3:8b → drafting: Best 8B for instruction following and tone
- mistral:7b-instruct → routing/decision: Good at reasoning through options
- No single model does everything — each is sized right for its subtask

Retry strategy:
- 3 attempts with exponential backoff (1s, 2s, 4s)
- Schema validation failure triggers retry (model produced malformed JSON)
- Timeout of 90s per call — if Ollama is taking longer, something is wrong
"""

import json
import time
import re
from typing import Any, Optional, Type
import httpx
from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type, before_sleep_log
)
import structlog
from pydantic import BaseModel, ValidationError
from backend.config import settings

logger = structlog.get_logger()


class LLMCallError(Exception):
    """Raised when LLM call fails after all retries."""
    pass


class SchemaValidationError(Exception):
    """Raised when LLM output doesn't conform to expected schema."""
    pass


def _extract_json(text: str) -> str:
    """
    Extract JSON from LLM output that may have surrounding text.
    Models sometimes wrap JSON in markdown fences or add preamble.
    """
    # Try direct parse first
    text = text.strip()
    if text.startswith("{") or text.startswith("["):
        return text

    # Try to find JSON block in markdown fences
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1)

    # Find first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]

    raise SchemaValidationError(f"No JSON found in LLM output: {text[:200]}")


class OllamaService:
    """
    Wrapper around Ollama's HTTP API.
    Handles retries, schema validation, and structured output extraction.
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.timeout = settings.OLLAMA_TIMEOUT
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout, connect=5.0),
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def health_check(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            client = await self._get_client()
            resp = await client.get("/api/tags")
            return resp.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[str]:
        """Return list of available Ollama models."""
        client = await self._get_client()
        resp = await client.get("/api/tags")
        resp.raise_for_status()
        return [m["name"] for m in resp.json().get("models", [])]

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        before_sleep=before_sleep_log(logger, "warning"),
    )
    async def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.1,  # Low temp for structured outputs — consistency matters
        max_tokens: int = 1024,
    ) -> tuple[str, int]:
        """
        Raw generation. Returns (text, token_count).
        Temperature 0.1 by default — we want deterministic structured outputs.
        For drafting we'll pass 0.3 for some creativity.
        """
        client = await self._get_client()

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
            },
        }

        start = time.monotonic()
        resp = await client.post("/api/chat", json=payload)

        if resp.status_code == 404:
            raise LLMCallError(f"Model '{model}' not found in Ollama. Run: ollama pull {model}")

        resp.raise_for_status()
        data = resp.json()
        latency_ms = int((time.monotonic() - start) * 1000)

        text = data["message"]["content"]
        tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)

        logger.debug(
            "llm_call_complete",
            model=model,
            latency_ms=latency_ms,
            tokens=tokens,
            prompt_chars=len(prompt),
        )

        return text, tokens

    async def generate_structured(
        self,
        model: str,
        prompt: str,
        schema: Type[BaseModel],
        system: Optional[str] = None,
        temperature: float = 0.05,
        max_retries: int = 3,
    ) -> tuple[BaseModel, int, bool]:
        """
        Generate structured output validated against a Pydantic schema.
        Returns (parsed_model, token_count, had_retries).

        Retry strategy for schema failures:
        - Retry 1: Append explicit JSON instruction to prompt
        - Retry 2: Simplify prompt, more explicit schema
        - After max retries: raise SchemaValidationError

        This is the right place to handle schema failures —
        not in the workflow, which should assume valid outputs.
        """
        had_retries = False
        total_tokens = 0

        for attempt in range(max_retries):
            if attempt > 0:
                had_retries = True
                # Augment prompt to be more explicit about JSON
                augmented_prompt = (
                    f"{prompt}\n\n"
                    f"IMPORTANT: You must respond with ONLY valid JSON matching this schema. "
                    f"No preamble, no explanation, no markdown fences:\n"
                    f"{json.dumps(schema.model_json_schema(), indent=2)}"
                )
                logger.warning("schema_retry", attempt=attempt + 1, model=model)
            else:
                augmented_prompt = prompt

            try:
                text, tokens = await self.generate(
                    model=model,
                    prompt=augmented_prompt,
                    system=system,
                    temperature=temperature,
                    max_tokens=1024,
                )
                total_tokens += tokens

                json_str = _extract_json(text)
                parsed = schema.model_validate_json(json_str)
                return parsed, total_tokens, had_retries

            except (SchemaValidationError, ValidationError, json.JSONDecodeError) as e:
                if attempt == max_retries - 1:
                    raise SchemaValidationError(
                        f"Failed to get valid {schema.__name__} after {max_retries} attempts. "
                        f"Last error: {e}"
                    )
                continue
            except LLMCallError:
                raise  # Don't retry LLM errors here — tenacity handles those

    async def generate_draft(
        self,
        prompt: str,
        system: Optional[str] = None,
    ) -> tuple[str, int]:
        """
        Free-text generation for drafting responses.
        Higher temperature for natural language.
        """
        return await self.generate(
            model=settings.DRAFTER_MODEL,
            prompt=prompt,
            system=system,
            temperature=0.3,  # Some creativity for natural tone
            max_tokens=512,   # Responses shouldn't be long
        )


# Singleton — one client per process
_ollama_service: Optional[OllamaService] = None


def get_ollama_service() -> OllamaService:
    global _ollama_service
    if _ollama_service is None:
        _ollama_service = OllamaService()
    return _ollama_service
