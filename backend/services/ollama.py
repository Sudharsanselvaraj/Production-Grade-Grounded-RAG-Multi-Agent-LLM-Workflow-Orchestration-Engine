import requests
import os
from typing import Any, Dict, Optional
import config
settings = config.settings


class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        self.base = base_url or settings.OLLAMA_BASE_URL
        self.timeout = timeout or settings.OLLAMA_TIMEOUT

    def generate(self, model: str, prompt: str, max_tokens: int = 512) -> Dict[str, Any]:
        """Call Ollama HTTP generate endpoint. Returns raw JSON response.

        Note: Ollama's HTTP API may vary; this wrapper uses a simple POST to /api/generate
        with `model` and `prompt`. Adjust if your Ollama version exposes a different path.
        """
        url = f"{self.base}/api/generate"
        payload = {"model": model, "prompt": prompt, "max_tokens": max_tokens}
        resp = requests.post(url, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()
