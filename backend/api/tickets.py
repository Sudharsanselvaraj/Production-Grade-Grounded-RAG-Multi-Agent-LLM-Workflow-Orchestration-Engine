from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..repositories.ticket_repo import list_tickets, get_ticket, update_ticket_decision
from ..repositories.ticket_repo import update_ticket_classification
from ..services.classifier import classify_ticket, ClassificationError
from ..services.decision import decide_and_persist
from ..services.drafter import generate_draft
from ..schemas.ticket import TicketOut, TicketList, DecisionIn
from ..auth.session import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/tickets", response_model=TicketList)
def api_list_tickets(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    items, total = list_tickets(db, skip, limit)
    return {"tickets": items, "total": total}


@router.get("/tickets/{ticket_id}", response_model=TicketOut)
def api_get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    t = get_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    return t


@router.post("/tickets/{ticket_id}/decision", response_model=TicketOut)
def api_ticket_decision(ticket_id: int, decision: DecisionIn, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    t = get_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    updated = update_ticket_decision(db, t, decision.action, decision.confidence)
    return updated


@router.post("/tickets/{ticket_id}/classify")
def api_ticket_classify(ticket_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    t = get_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    try:
        cls = classify_ticket(db, t)
    except ClassificationError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"classification": cls}


@router.post("/tickets/{ticket_id}/decide")
def api_ticket_decide(ticket_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    t = get_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    # Expect classification already present; otherwise run classification
    cls = {
        "category": t.ai_decision or "unknown",
        "confidence": float(t.ai_confidence) if t.ai_confidence else 0.0,
        "spam_score": 0.0,
        "escalation_risk": 0.0,
        "urgency": "medium",
        "sentiment": "neutral",
    }
    # If classification not present, run it
    if cls["category"] == "unknown":
        try:
            cls = classify_ticket(db, t)
        except ClassificationError:
            cls = cls
    result = decide_and_persist(db, t, cls)
    return result


@router.post("/tickets/{ticket_id}/draft")
def api_ticket_draft(ticket_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    t = get_ticket(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    # ensure classification exists for routing info
    if not t.ai_decision:
        try:
            classify_ticket(db, t)
        except ClassificationError:
            pass
    try:
        out = generate_draft(db, t, prompt_path="backend/prompts/drafting/v2.md")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return out
