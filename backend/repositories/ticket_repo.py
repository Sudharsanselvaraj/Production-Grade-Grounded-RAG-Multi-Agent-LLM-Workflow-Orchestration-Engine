from typing import Tuple, Optional
from sqlalchemy.orm import Session
from ..models.tables import Ticket


def list_tickets(db: Session, skip: int = 0, limit: int = 50) -> Tuple[list, int]:
    q = db.query(Ticket).order_by(Ticket.created_at.desc())
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return items, total


def get_ticket(db: Session, ticket_id: int) -> Optional[Ticket]:
    return db.query(Ticket).filter(Ticket.id == ticket_id).first()


def update_ticket_decision(db: Session, ticket: Ticket, action: str, confidence: float) -> Ticket:
    ticket.ai_decision = action
    ticket.ai_confidence = str(confidence)
    if action in ("close", "mark_spam"):
        ticket.status = "closed"
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket_classification(db: Session, ticket: Ticket, classification: dict) -> Ticket:
    # store structured classification results onto ticket columns or metadata
    ticket.ai_decision = classification.get("category")
    ticket.ai_confidence = str(classification.get("confidence"))
    # flag spam if above threshold
    try:
        spam_score = float(classification.get("spam_score", 0))
    except Exception:
        spam_score = 0.0
    ticket.is_spam = spam_score >= 0.9
    # persist other fields in a simple metadata blob on status for now
    # In a richer schema we'd have a JSON column for classification_details
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
