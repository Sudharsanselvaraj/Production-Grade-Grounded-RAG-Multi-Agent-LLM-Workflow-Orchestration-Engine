import re
try:
    from langdetect import detect
except Exception:
    detect = None


def detect_language(text: str) -> str:
    """Lightweight language detection with fallback.

    Prefer `langdetect` if available; otherwise use a heuristic.
    """
    if not text:
        return "unknown"
    if detect:
        try:
            return detect(text)
        except Exception:
            pass
    # fallback heuristic: if many non-ascii chars, mark as non-en
    non_ascii = len(re.findall(r"[^\x00-\x7F]", text))
    if non_ascii > max(3, len(text) * 0.05):
        return "non-en"
    return "en"
