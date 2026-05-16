import hashlib
import re
from typing import Dict
from ..utils.lang_detect import detect_language
from ..schemas.email import EmailIn


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _sanitize_text(text: str) -> str:
    # Basic sanitization: remove control chars and excessive whitespace.
    text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", text)
    return _normalize_whitespace(text)


def dedup_key(email: EmailIn) -> str:
    h = hashlib.sha256()
    h.update(email.subject.encode("utf-8"))
    h.update(b"\n")
    h.update(email.body.encode("utf-8"))
    h.update(b"\n")
    h.update(email.sender.email.encode("utf-8"))
    return h.hexdigest()


def preprocess_email(email: EmailIn) -> Dict:
    """Preprocess and sanitize inbound email for downstream pipelines.

    Returns a dict with normalized body, language, and dedup key.
    """
    normalized_subject = _sanitize_text(email.subject)
    normalized_body = _sanitize_text(email.body)
    language = detect_language(normalized_body)
    key = dedup_key(email)
    return {
        "subject": normalized_subject,
        "body": normalized_body,
        "language": language,
        "dedup_key": key,
    }
