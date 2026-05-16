"""
Lumen Support AI — Pydantic Schemas
All API input/output types. Strict validation — no silent data corruption.
"""

import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.models.db_models import TicketStatus, ActionType, CustomerTier


# ─── Inbound Email ────────────────────────────────────────────────────────────

class EmailIngestionRequest(BaseModel):
    """Schema for POST /api/tickets/ingest"""
    subject: str = Field(..., min_length=1, max_length=500)
    body: str = Field(..., min_length=1, max_length=10_000)
    sender_email: EmailStr
    # Optional enrichment — can be populated by email routing rules
    customer_id: Optional[str] = None
    attachment_types: Optional[list[str]] = None

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Email body cannot be empty or whitespace only")
        return v


class EmailIngestionResponse(BaseModel):
    ticket_id: uuid.UUID
    status: TicketStatus
    message: str


# ─── Classification ───────────────────────────────────────────────────────────

class ClassificationOutput(BaseModel):
    """Structured output from classification model. Validated against this schema."""
    category: str = Field(..., description="billing|technical|account|legal|spam|general|feedback")
    urgency_score: float = Field(..., ge=0.0, le=1.0)
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    spam_probability: float = Field(..., ge=0.0, le=1.0)
    escalation_risk: float = Field(..., ge=0.0, le=1.0)
    legal_sensitivity: float = Field(..., ge=0.0, le=1.0)
    customer_tier_guess: str = Field(..., description="free|starter|pro|enterprise|unknown")
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="One-sentence explanation of classification")


# ─── Retrieval ────────────────────────────────────────────────────────────────

class RetrievedChunk(BaseModel):
    source_type: str  # help_article | past_ticket | account_note
    source_id: str
    source_title: str
    chunk_text: str
    relevance_score: float
    reranker_score: Optional[float] = None
    url: Optional[str] = None


# ─── Decision ────────────────────────────────────────────────────────────────

class DecisionOutput(BaseModel):
    action: ActionType
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    assigned_team: Optional[str] = None
    urgency_override: bool = False


# ─── Draft Response ───────────────────────────────────────────────────────────

class DraftResponse(BaseModel):
    body: str
    citations: list[RetrievedChunk]
    tone: str  # professional|empathetic|firm|neutral
    word_count: int
    prompt_version: str
    has_hallucination_risk: bool = False
    hallucination_flags: list[str] = []


# ─── Ticket Read API ─────────────────────────────────────────────────────────

class TicketSummary(BaseModel):
    """Lightweight ticket for queue view — minimal data transfer."""
    id: uuid.UUID
    created_at: datetime
    subject: str
    sender_email: str
    customer_tier: Optional[CustomerTier]
    status: TicketStatus
    category: Optional[str]
    urgency_score: Optional[float]
    sentiment_score: Optional[float]
    proposed_action: Optional[ActionType]
    action_confidence: Optional[float]
    sla_risk: str
    processing_duration_ms: Optional[int]

    class Config:
        from_attributes = True


class TraceStep(BaseModel):
    stage: str
    started_at: str
    duration_ms: int
    status: str  # success|error|skipped
    details: dict[str, Any] = {}


class WorkflowTraceRead(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    steps: list[TraceStep]
    retrieved_chunks: Optional[list[dict]]
    retrieval_latency_ms: Optional[int]
    reranker_scores: Optional[list]
    classification_prompt_version: Optional[str]
    drafting_prompt_version: Optional[str]
    routing_prompt_version: Optional[str]
    guardrail_results: Optional[dict]
    pii_detected: bool
    injection_detected: bool
    total_latency_ms: Optional[int]
    total_tokens: Optional[int]
    had_retries: bool
    retry_count: int
    error_stages: Optional[list]

    class Config:
        from_attributes = True


class TicketDetail(BaseModel):
    """Full ticket for detail view — includes everything."""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    subject: str
    body_sanitized: str
    sender_email: str
    customer_email: str
    detected_language: Optional[str]
    has_attachments: bool
    status: TicketStatus
    category: Optional[str]
    urgency_score: Optional[float]
    sentiment_score: Optional[float]
    spam_probability: Optional[float]
    escalation_risk: Optional[float]
    legal_sensitivity: Optional[float]
    customer_tier: Optional[CustomerTier]
    classification_confidence: Optional[float]
    classification_raw: Optional[dict]
    proposed_action: Optional[ActionType]
    action_confidence: Optional[float]
    action_reasoning: Optional[str]
    draft_response: Optional[str]
    draft_citations: Optional[list]
    reviewed_at: Optional[datetime]
    final_response: Optional[str]
    human_override_action: Optional[ActionType]
    edit_distance: Optional[int]
    account_metadata: Optional[dict]
    workflow_error: Optional[str]
    sla_risk: str
    trace: Optional[WorkflowTraceRead] = None

    class Config:
        from_attributes = True


# ─── Human Review ────────────────────────────────────────────────────────────

class ReviewDecision(BaseModel):
    action: str  # approve | edit | reject | escalate
    edited_response: Optional[str] = None
    override_action: Optional[ActionType] = None
    reviewer_notes: Optional[str] = None


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_tickets: int
    auto_resolved: int
    human_overrides: int
    escalated: int
    spam_caught: int
    avg_processing_ms: float
    override_rate: float
    auto_resolution_rate: float
    category_distribution: dict[str, int]
    urgency_distribution: dict[str, int]
    avg_confidence: float


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
