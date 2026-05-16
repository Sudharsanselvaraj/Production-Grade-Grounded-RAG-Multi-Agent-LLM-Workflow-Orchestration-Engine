"""
Lumen Support AI — API Routes: Tickets
"""

import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
import Levenshtein  # For edit distance tracking

from backend.database import get_session
from backend.auth.auth import get_current_user, require_lead
from backend.schemas.schemas import (
    EmailIngestionRequest, EmailIngestionResponse, TicketSummary,
    TicketDetail, ReviewDecision, AnalyticsSummary,
)
from backend.models.db_models import (
    Ticket, TicketStatus, ActionType, CustomerTier
)
from backend.repositories.ticket_repo import TicketRepository
from backend.workflows.orchestrator import WorkflowOrchestrator
from backend.utils.lang_detect import detect_language
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/tickets", tags=["tickets"])


async def _run_workflow_background(ticket_id: uuid.UUID):
    """
    Background task for workflow execution.
    Separate from request lifecycle — ingest returns immediately,
    workflow runs async. Polling or WebSocket for status.
    """
    from backend.database import async_session_factory
    async with async_session_factory() as session:
        repo = TicketRepository(session)
        ticket = await repo.get_by_id(ticket_id)
        if not ticket:
            logger.error("workflow_bg_ticket_not_found", ticket_id=str(ticket_id))
            return

        orchestrator = WorkflowOrchestrator()
        await orchestrator.run(ticket, session)
        await session.commit()


@router.post("/ingest", response_model=EmailIngestionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_email(
    payload: EmailIngestionRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    # No auth on ingest — this would be called by email webhook (API key auth in prod)
):
    """
    Ingest an inbound support email.
    Returns immediately with ticket_id.
    Workflow runs in background.
    """
    repo = TicketRepository(session)

    # Deduplication check
    is_dup = await repo.check_duplicate(str(payload.sender_email), payload.subject)
    if is_dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate ticket detected (same sender + subject within 1 hour)",
        )

    # Detect language
    detected_lang = detect_language(payload.body)

    ticket = Ticket(
        subject=payload.subject,
        body_raw=payload.body,
        body_sanitized=payload.body,  # Will be cleaned by guardrails in workflow
        sender_email=str(payload.sender_email),
        customer_email=str(payload.sender_email),
        detected_language=detected_lang,
        has_attachments=bool(payload.attachment_types),
        attachment_types=payload.attachment_types,
        status=TicketStatus.PENDING,
        customer_id=payload.customer_id,
    )

    await repo.create(ticket)
    await session.commit()

    # Kick off workflow in background
    background_tasks.add_task(_run_workflow_background, ticket.id)

    logger.info("ticket_ingested", ticket_id=str(ticket.id), sender=str(payload.sender_email))

    return EmailIngestionResponse(
        ticket_id=ticket.id,
        status=ticket.status,
        message="Email ingested. Workflow started.",
    )


@router.get("", response_model=dict)
async def list_tickets(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Queue view — returns paginated tickets sorted by urgency."""
    repo = TicketRepository(session)

    status_enum = None
    if status_filter:
        try:
            status_enum = TicketStatus(status_filter)
        except ValueError:
            raise HTTPException(400, f"Invalid status: {status_filter}")

    tickets, total = await repo.list_queue(status=status_enum, limit=limit, offset=offset)

    return {
        "tickets": [
            {
                "id": str(t.id),
                "created_at": t.created_at.isoformat(),
                "subject": t.subject,
                "sender_email": t.sender_email,
                "customer_tier": t.customer_tier.value if t.customer_tier else None,
                "status": t.status.value,
                "category": t.category,
                "urgency_score": t.urgency_score,
                "sentiment_score": t.sentiment_score,
                "proposed_action": t.proposed_action.value if t.proposed_action else None,
                "action_confidence": t.action_confidence,
                "sla_risk": t.sla_risk,
                "processing_duration_ms": t.processing_duration_ms,
            }
            for t in tickets
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{ticket_id}", response_model=dict)
async def get_ticket(
    ticket_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """Full ticket detail including trace."""
    repo = TicketRepository(session)
    ticket = await repo.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")

    trace_data = None
    if ticket.trace:
        t = ticket.trace
        trace_data = {
            "id": str(t.id),
            "steps": t.steps or [],
            "retrieved_chunks": t.retrieved_chunks or [],
            "retrieval_latency_ms": t.retrieval_latency_ms,
            "reranker_scores": t.reranker_scores or [],
            "classification_prompt_version": t.classification_prompt_version,
            "drafting_prompt_version": t.drafting_prompt_version,
            "routing_prompt_version": t.routing_prompt_version,
            "guardrail_results": t.guardrail_results or {},
            "pii_detected": t.pii_detected,
            "injection_detected": t.injection_detected,
            "total_latency_ms": t.total_latency_ms,
            "total_tokens": t.total_tokens,
            "had_retries": t.had_retries,
            "retry_count": t.retry_count,
            "error_stages": t.error_stages or [],
            "classification_prompt": t.classification_prompt,
            "drafting_prompt": t.drafting_prompt,
            "routing_prompt": t.routing_prompt,
        }

    return {
        "id": str(ticket.id),
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "subject": ticket.subject,
        "body_sanitized": ticket.body_sanitized,
        "sender_email": ticket.sender_email,
        "customer_email": ticket.customer_email,
        "detected_language": ticket.detected_language,
        "has_attachments": ticket.has_attachments,
        "status": ticket.status.value,
        "category": ticket.category,
        "urgency_score": ticket.urgency_score,
        "sentiment_score": ticket.sentiment_score,
        "spam_probability": ticket.spam_probability,
        "escalation_risk": ticket.escalation_risk,
        "legal_sensitivity": ticket.legal_sensitivity,
        "customer_tier": ticket.customer_tier.value if ticket.customer_tier else None,
        "classification_confidence": ticket.classification_confidence,
        "classification_raw": ticket.classification_raw,
        "proposed_action": ticket.proposed_action.value if ticket.proposed_action else None,
        "action_confidence": ticket.action_confidence,
        "action_reasoning": ticket.action_reasoning,
        "draft_response": ticket.draft_response,
        "draft_citations": ticket.draft_citations or [],
        "reviewed_at": ticket.reviewed_at.isoformat() if ticket.reviewed_at else None,
        "final_response": ticket.final_response,
        "human_override_action": ticket.human_override_action.value if ticket.human_override_action else None,
        "edit_distance": ticket.edit_distance,
        "account_metadata": ticket.account_metadata or {},
        "workflow_error": ticket.workflow_error,
        "sla_risk": ticket.sla_risk,
        "processing_duration_ms": ticket.processing_duration_ms,
        "trace": trace_data,
    }


@router.post("/{ticket_id}/review")
async def review_ticket(
    ticket_id: uuid.UUID,
    decision: ReviewDecision,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Human review endpoint.
    Supports: approve | edit | reject | escalate
    Tracks edit distance for self-improvement signal.
    """
    repo = TicketRepository(session)
    ticket = await repo.get_by_id(ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")

    if ticket.status not in [TicketStatus.AWAITING_REVIEW, TicketStatus.PROCESSING]:
        raise HTTPException(400, f"Ticket is not awaiting review (status: {ticket.status.value})")

    ticket.reviewed_by = uuid.UUID(current_user["sub"])
    ticket.reviewed_at = datetime.utcnow()

    if decision.action == "approve":
        ticket.status = TicketStatus.APPROVED
        ticket.final_response = ticket.draft_response

    elif decision.action == "edit":
        ticket.status = TicketStatus.EDITED
        ticket.final_response = decision.edited_response
        # Track edit distance — signal for prompt improvement
        if ticket.draft_response and decision.edited_response:
            ticket.edit_distance = Levenshtein.distance(
                ticket.draft_response, decision.edited_response
            )

    elif decision.action == "reject":
        ticket.status = TicketStatus.REJECTED
        if decision.override_action:
            ticket.human_override_action = decision.override_action

    elif decision.action == "escalate":
        ticket.status = TicketStatus.ESCALATED
        if decision.override_action:
            ticket.human_override_action = decision.override_action

    else:
        raise HTTPException(400, f"Unknown review action: {decision.action}")

    await repo.update(ticket)
    logger.info(
        "ticket_reviewed",
        ticket_id=str(ticket_id),
        action=decision.action,
        reviewer=current_user.get("email"),
    )

    return {"status": "ok", "new_status": ticket.status.value}


@router.get("/analytics/summary", response_model=dict)
async def get_analytics(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(require_lead),  # Lead only
):
    """Analytics summary. Lead role required."""
    repo = TicketRepository(session)
    return await repo.get_analytics()
