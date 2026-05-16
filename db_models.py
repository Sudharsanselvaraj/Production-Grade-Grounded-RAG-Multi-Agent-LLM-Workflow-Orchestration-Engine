"""
Lumen Support AI — Database Models
SQLAlchemy 2.0 async ORM models. Each table has a clear purpose.
UUIDs as PKs for distributed-safe ID generation.
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Text, Float, Boolean, Integer, DateTime, JSON,
    ForeignKey, Enum as SAEnum, Index
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum


class Base(DeclarativeBase):
    pass


class TicketStatus(str, enum.Enum):
    PENDING = "pending"          # Just ingested, workflow not started
    PROCESSING = "processing"    # Workflow running
    AWAITING_REVIEW = "awaiting_review"  # AI done, human needs to act
    APPROVED = "approved"        # Human approved AI response
    EDITED = "edited"            # Human edited AI response
    REJECTED = "rejected"        # Human rejected, manual handling
    SENT = "sent"                # Response sent to customer
    ESCALATED = "escalated"      # Routed to specialized team
    SPAM = "spam"                # Marked as spam, no action
    CLOSED = "closed"            # Ticket resolved


class ActionType(str, enum.Enum):
    AUTO_REPLY = "auto_reply"
    ESCALATE_BILLING = "escalate_billing"
    ESCALATE_ENGINEERING = "escalate_engineering"
    ESCALATE_MANAGEMENT = "escalate_management"
    ROUTE_LEGAL = "route_legal"
    MARK_SPAM = "mark_spam"
    REQUEST_CLARIFICATION = "request_clarification"
    CLOSE_NO_ACTION = "close_no_action"


class CustomerTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Ticket(Base):
    """
    Core ticket entity. One row per inbound email.
    Denormalized classification fields for query performance — avoids JOINs on hot paths.
    """
    __tablename__ = "tickets"
    __table_args__ = (
        Index("ix_tickets_status_created", "status", "created_at"),
        Index("ix_tickets_customer_email", "customer_email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Inbound email fields
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body_raw: Mapped[str] = mapped_column(Text, nullable=False)
    body_sanitized: Mapped[str] = mapped_column(Text, nullable=False)
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    detected_language: Mapped[Optional[str]] = mapped_column(String(10))
    has_attachments: Mapped[bool] = mapped_column(Boolean, default=False)
    attachment_types: Mapped[Optional[list]] = mapped_column(JSON)  # ["image/png", ...]

    # Status
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus), default=TicketStatus.PENDING)

    # Classification outputs (denormalized for query performance)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    urgency_score: Mapped[Optional[float]] = mapped_column(Float)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float)  # -1 (negative) to 1 (positive)
    spam_probability: Mapped[Optional[float]] = mapped_column(Float)
    escalation_risk: Mapped[Optional[float]] = mapped_column(Float)
    legal_sensitivity: Mapped[Optional[float]] = mapped_column(Float)
    customer_tier: Mapped[Optional[CustomerTier]] = mapped_column(SAEnum(CustomerTier))
    classification_confidence: Mapped[Optional[float]] = mapped_column(Float)
    classification_raw: Mapped[Optional[dict]] = mapped_column(JSON)  # Full structured output

    # Decision
    proposed_action: Mapped[Optional[ActionType]] = mapped_column(SAEnum(ActionType))
    action_confidence: Mapped[Optional[float]] = mapped_column(Float)
    action_reasoning: Mapped[Optional[str]] = mapped_column(Text)

    # Generated response
    draft_response: Mapped[Optional[str]] = mapped_column(Text)
    draft_citations: Mapped[Optional[list]] = mapped_column(JSON)  # [{source, chunk, relevance}]
    draft_version: Mapped[int] = mapped_column(Integer, default=0)

    # Human review
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    final_response: Mapped[Optional[str]] = mapped_column(Text)
    human_override_action: Mapped[Optional[ActionType]] = mapped_column(SAEnum(ActionType))
    edit_distance: Mapped[Optional[int]] = mapped_column(Integer)  # Levenshtein distance draft→final

    # Customer linkage
    customer_id: Mapped[Optional[str]] = mapped_column(String(255))  # From CRM
    account_metadata: Mapped[Optional[dict]] = mapped_column(JSON)

    # Workflow metadata
    workflow_trace_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    processing_duration_ms: Mapped[Optional[int]] = mapped_column(Integer)
    token_count_total: Mapped[Optional[int]] = mapped_column(Integer)
    workflow_error: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reviewed_by])
    trace: Mapped[Optional["WorkflowTrace"]] = relationship("WorkflowTrace", back_populates="ticket", uselist=False)

    @property
    def sla_risk(self) -> str:
        """Computed SLA risk based on urgency and age."""
        if self.urgency_score is None:
            return "unknown"
        if self.urgency_score > 0.8:
            return "critical"
        elif self.urgency_score > 0.6:
            return "high"
        elif self.urgency_score > 0.4:
            return "medium"
        return "low"


class WorkflowTrace(Base):
    """
    Per-ticket execution trace. This is the observability backbone.
    Stores every step: retrieval chunks, model calls, decisions, latencies.
    Critical for: debugging failures, eval harness replay, human audit.
    """
    __tablename__ = "workflow_traces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Step-by-step trace (ordered list of step records)
    steps: Mapped[list] = mapped_column(JSON, default=list)

    # Retrieval trace
    retrieved_chunks: Mapped[Optional[list]] = mapped_column(JSON)
    retrieval_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    reranker_scores: Mapped[Optional[list]] = mapped_column(JSON)

    # Model call traces
    classification_prompt: Mapped[Optional[str]] = mapped_column(Text)
    classification_prompt_version: Mapped[Optional[str]] = mapped_column(String(50))
    classification_raw_output: Mapped[Optional[str]] = mapped_column(Text)
    classification_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    classification_tokens: Mapped[Optional[int]] = mapped_column(Integer)

    routing_prompt: Mapped[Optional[str]] = mapped_column(Text)
    routing_prompt_version: Mapped[Optional[str]] = mapped_column(String(50))
    routing_raw_output: Mapped[Optional[str]] = mapped_column(Text)
    routing_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)

    drafting_prompt: Mapped[Optional[str]] = mapped_column(Text)
    drafting_prompt_version: Mapped[Optional[str]] = mapped_column(String(50))
    drafting_raw_output: Mapped[Optional[str]] = mapped_column(Text)
    drafting_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    drafting_tokens: Mapped[Optional[int]] = mapped_column(Integer)

    # Guardrail results
    guardrail_results: Mapped[Optional[dict]] = mapped_column(JSON)
    pii_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    injection_detected: Mapped[bool] = mapped_column(Boolean, default=False)

    # Total
    total_latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    had_retries: Mapped[bool] = mapped_column(Boolean, default=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_stages: Mapped[Optional[list]] = mapped_column(JSON)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="trace")


class User(Base):
    """
    Auth users. Simple — not trying to reinvent IAM.
    Two roles: agent (can review tickets) and lead (can see analytics, manage agents).
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="agent")  # agent | lead
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)


class HelpArticle(Base):
    """
    Cached help center articles (sourced from Notion).
    Synced periodically — we don't want live Notion calls in the hot path.
    """
    __tablename__ = "help_articles"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)  # Notion page ID
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    tags: Mapped[Optional[list]] = mapped_column(JSON)
    last_synced: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notion_url: Mapped[Optional[str]] = mapped_column(String(500))


class CustomerAccount(Base):
    """
    Customer account data (sourced from Supabase CRM table).
    Enriched during ticket processing.
    """
    __tablename__ = "customer_accounts"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tier: Mapped[CustomerTier] = mapped_column(SAEnum(CustomerTier), default=CustomerTier.FREE)
    company: Mapped[Optional[str]] = mapped_column(String(255))
    account_age_days: Mapped[Optional[int]] = mapped_column(Integer)
    mrr_usd: Mapped[Optional[float]] = mapped_column(Float)
    open_tickets: Mapped[int] = mapped_column(Integer, default=0)
    lifetime_tickets: Mapped[int] = mapped_column(Integer, default=0)
    last_ticket_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    metadata: Mapped[Optional[dict]] = mapped_column(JSON)
