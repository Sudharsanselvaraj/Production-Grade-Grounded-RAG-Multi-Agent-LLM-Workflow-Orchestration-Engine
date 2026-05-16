"""Language detection — thin wrapper around langdetect with fallback."""

from typing import Optional


def detect_language(text: str) -> Optional[str]:
    try:
        from langdetect import detect
        return detect(text[:500])  # Only need first 500 chars
    except Exception:
        return "en"  # Safe fallback
