import json
import time
from typing import Dict
from .ollama import OllamaClient
import config
settings = config.settings
from ..repositories.ticket_repo import update_ticket_classification


class ClassificationError(Exception):
    pass


def _extract_json_payload(text: str) -> str:
    start = text.find("{")
    if start == -1:
        raise ClassificationError("model output missing JSON object")
    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
    raise ClassificationError("unterminated JSON object in model output")


def load_prompt(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def classify_ticket(db, ticket, prompt_path: str = "backend/prompts/classification/v1.md") -> Dict:
    prompt = load_prompt(prompt_path)
    # Build a concise prompt payload embedding the ticket
    prompt_text = f"{prompt}\n\nEmail Subject:\n{ticket.subject}\n\nEmail Body:\n{ticket.body}\n\nReturn only JSON."
    client = OllamaClient()
    # observability
    try:
        from ..observability.tracer import start_trace, log_event, finish_trace
        trace = start_trace(db, ticket_id=ticket.id)
        log_event(db, trace.id, "classify:start", {"model": settings.CLASSIFIER_MODEL})
    except Exception:
        trace = None
    attempts = 0
    while attempts < 3:
        attempts += 1
        try:
            resp = client.generate(model=settings.CLASSIFIER_MODEL, prompt=prompt_text, max_tokens=256)
            # Expect resp to contain generated text; try to extract
            text = None
            if isinstance(resp, dict):
                # Ollama may return {'choices': [{'message': '...'}]} or {'output': '...'}
                if "output" in resp:
                    text = resp["output"]
                elif "response" in resp:
                    text = resp["response"]
                elif "choices" in resp and resp["choices"]:
                    c = resp["choices"][0]
                    text = c.get("message") or c.get("text") or c.get("content")
            if not text:
                raise ClassificationError("no text in model response")
            # Attempt to parse JSON from the model output
            try:
                j = json.loads(text)
            except Exception:
                j = json.loads(_extract_json_payload(text))
            # Sanity-check required keys
            required = ["category", "urgency", "sentiment", "spam_score", "escalation_risk", "confidence"]
            for k in required:
                if k not in j:
                    raise ClassificationError(f"missing key {k} in classification output")
            # Persist classification to ticket
            update_ticket_classification(db, ticket, j)
            if trace:
                log_event(db, trace.id, "classify:success", {"classification": j})
                finish_trace(db, trace, {"stage": "classify"})
            return j
        except Exception as e:
            last_exc = e
            time.sleep(attempts * 0.5)
    raise ClassificationError(f"classification failed after retries: {last_exc}")
