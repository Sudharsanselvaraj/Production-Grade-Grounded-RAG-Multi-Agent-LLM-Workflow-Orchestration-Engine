from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TicketOut(BaseModel):
    id: int
    customer_id: Optional[int]
    subject: str
    body: str
    created_at: datetime
    status: str
    ai_decision: Optional[str]
    ai_confidence: Optional[str]
    is_spam: bool

    class Config:
        orm_mode = True


class TicketList(BaseModel):
    tickets: List[TicketOut]
    total: int


class DecisionIn(BaseModel):
    action: str
    confidence: float
    note: Optional[str] = None
