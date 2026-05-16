from backend.services.preprocessing import preprocess_email
from backend.schemas.email import EmailIn, SenderMetadata


def test_preprocess_basic():
    email = EmailIn(subject="hi", body="hello world", sender=SenderMetadata(email="a@b.com"))
    out = preprocess_email(email)
    assert out["language"] in ("en", "non-en", "unknown")
    assert "dedup_key" in out
