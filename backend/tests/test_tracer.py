from backend.observability.tracer import start_trace, log_event, finish_trace
from backend.db import SessionLocal, init_db


def test_tracer_roundtrip():
    init_db()
    db = SessionLocal()
    t = start_trace(db, ticket_id=1, run_id="test-run")
    ev = log_event(db, t.id, "step1", {"foo": "bar"})
    finished = finish_trace(db, t, {"ok": True})
    assert finished.end_time is not None
    db.close()
