from datetime import datetime
from typing import Optional, Dict, Any
from ..db import SessionLocal
from ..models.tables import Trace, TraceEvent


def start_trace(db, ticket_id: Optional[int] = None, run_id: Optional[str] = None) -> Trace:
    trace = Trace(ticket_id=ticket_id, run_id=run_id, start_time=datetime.utcnow())
    db.add(trace)
    db.commit()
    db.refresh(trace)
    return trace


def log_event(db, trace_id: int, step: str, detail: Optional[Dict[str, Any]] = None):
    detail_text = None
    if detail is not None:
        try:
            import json
            detail_text = json.dumps(detail)
        except Exception:
            detail_text = str(detail)
    ev = TraceEvent(trace_id=trace_id, timestamp=datetime.utcnow(), step=step, detail=detail_text)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def finish_trace(db, trace: Trace, summary: Optional[Dict[str, Any]] = None):
    trace.end_time = datetime.utcnow()
    if summary is not None:
        try:
            import json
            trace.summary = json.dumps(summary)
        except Exception:
            trace.summary = str(summary)
    db.add(trace)
    db.commit()
    db.refresh(trace)
    return trace
