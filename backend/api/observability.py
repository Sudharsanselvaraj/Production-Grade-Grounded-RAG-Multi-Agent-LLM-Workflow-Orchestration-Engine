from fastapi import APIRouter, HTTPException, Depends
from ..db import SessionLocal
from ..models.tables import Trace, TraceEvent
from ..auth.session import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/traces/{ticket_id}")
def api_get_traces(ticket_id: int, current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    traces = db.query(Trace).filter(Trace.ticket_id == ticket_id).all()
    if not traces:
        raise HTTPException(status_code=404, detail="no traces")
    out = []
    for t in traces:
        events = db.query(TraceEvent).filter(TraceEvent.trace_id == t.id).order_by(TraceEvent.timestamp.asc()).all()
        out.append({"trace": {"id": t.id, "start_time": str(t.start_time), "end_time": str(t.end_time), "summary": t.summary}, "events": [{"id": e.id, "timestamp": str(e.timestamp), "step": e.step, "detail": e.detail} for e in events]})
    return {"traces": out}
