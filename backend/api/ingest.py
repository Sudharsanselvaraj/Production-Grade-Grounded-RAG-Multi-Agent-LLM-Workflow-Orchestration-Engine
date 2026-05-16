from fastapi import APIRouter, HTTPException
from ..schemas.email import EmailIn
from ..services.preprocessing import preprocess_email

router = APIRouter()


@router.post("/ingest")
async def ingest_email(email: EmailIn):
    """Ingest an inbound support email, preprocess and enqueue for workflow orchestration.

    This endpoint performs validation and preprocessing only. Persistence and
    orchestration are handled by downstream services.
    """
    try:
        pre = preprocess_email(email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # For now we return the preprocessing result as an acknowledgement.
    return {"status": "accepted", "dedup_key": pre["dedup_key"], "language": pre["language"]}
