"""
Lumen Support AI — Workflow Orchestrator
The main pipeline. Every step is observable, retryable, and independently testable.

Pipeline stages:
1. Ingest → sanitize, normalize, dedup
2. Guardrails (input) → injection, PII detection
3. Enrich → customer account lookup, past ticket retrieval
4. Classify → multi-dimensional classification via LLM
5. Decide → hybrid deterministic + LLM routing
6. Retrieve → semantic search for supporting context
7. Draft → grounded response generation (if action = auto_reply)
8. Guardrails (output) → hallucination, PII, policy checks
9. Persist → write ticket + trace to DB

What uses deterministic logic vs LLM:
- DETERMINISTIC: spam (threshold on score), legal flagging (threshold), language detection
  Reason: these need to be auditable, fast, and not hallucinate
- LLM: classification (structured multi-dimensional), routing (ambiguous cases),
  drafting (natural language generation)
  Reason: regex can't understand nuance; LLM handles the long tail of email patterns
"""

import time
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from backend.config import settings
from backend.models.db_models import Ticket, WorkflowTrace, TicketStatus, ActionType, CustomerTier
from backend.schemas.schemas import (
    ClassificationOutput, DecisionOutput, RetrievedChunk, DraftResponse
)
from backend.services.ollama_service import get_ollama_service, SchemaValidationError, LLMCallError
from backend.retrieval.retrieval_service import get_retrieval_service
from backend.guardrails.guardrails import run_input_guardrails, run_output_guardrails
from backend.prompts.registry import get_prompt
from backend.observability.tracer import WorkflowTracer, StepTimer
from backend.repositories.ticket_repo import TicketRepository
from backend.repositories.trace_repo import TraceRepository
from backend.repositories.customer_repo import CustomerRepository

logger = structlog.get_logger()


def _deterministic_routing(classification: ClassificationOutput) -> Optional[ActionType]:
    """
    Fast, auditable routing rules that don't need LLM.
    These handle clear-cut cases where LLM adds no value.
    Returns None if case is ambiguous (needs LLM routing).
    """
    # Hard spam: deterministic, not LLM — we don't want model making exceptions
    if classification.spam_probability >= settings.SPAM_THRESHOLD:
        return ActionType.MARK_SPAM

    # Legal sensitivity: always route to legal, no exceptions
    if classification.legal_sensitivity >= settings.LEGAL_FLAG_THRESHOLD:
        return ActionType.ROUTE_LEGAL

    # Critical escalation: production down / data loss reports
    if classification.urgency_score >= 0.95 and classification.escalation_risk >= 0.85:
        return ActionType.ESCALATE_ENGINEERING

    # Ambiguous: let LLM reason through it
    return None


def _format_retrieved_context(chunks: list[RetrievedChunk]) -> str:
    """Format retrieved chunks for inclusion in prompt. Numbered for citation."""
    if not chunks:
        return "No relevant context retrieved."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Source: {chunk.source_title} (type: {chunk.source_type}, "
            f"relevance: {chunk.relevance_score:.2f})\n{chunk.chunk_text}"
        )
    return "\n\n".join(parts)


class WorkflowOrchestrator:
    """
    Main workflow pipeline. Stateless — all state passes through parameters.
    Designed for testability: each stage can be tested in isolation.
    """

    def __init__(self):
        self.ollama = get_ollama_service()
        self.retrieval = get_retrieval_service()

    async def run(
        self,
        ticket: Ticket,
        session: AsyncSession,
    ) -> Ticket:
        """
        Run the full pipeline for a ticket.
        Updates ticket in place, persists trace at end.
        On any unrecoverable error: marks ticket with error, still persists.
        """
        tracer = WorkflowTracer(ticket.id)
        ticket_repo = TicketRepository(session)
        trace_repo = TraceRepository(session)

        # Mark as processing
        ticket.status = TicketStatus.PROCESSING
        await ticket_repo.update(ticket)

        try:
            # Stage 1: Input guardrails
            await self._stage_input_guardrails(ticket, tracer)

            # Stage 2: Customer enrichment
            await self._stage_enrich(ticket, session, tracer)

            # Stage 3: Classification
            classification = await self._stage_classify(ticket, tracer)
            if classification is None:
                ticket.status = TicketStatus.AWAITING_REVIEW
                ticket.workflow_error = "Classification failed after retries"
                return ticket

            # Stage 4: Deterministic routing check
            det_action = _deterministic_routing(classification)

            if det_action is not None:
                # Deterministic path — no LLM needed
                ticket.proposed_action = det_action
                ticket.action_confidence = 1.0
                ticket.action_reasoning = f"Deterministic rule: {det_action.value}"
                tracer.record_step("deterministic_routing", 0, "success",
                                   action=det_action.value, reason="threshold")
                ticket.status = TicketStatus.AWAITING_REVIEW
                ticket.workflow_trace_id = tracer.trace_id
                ticket.processing_duration_ms = tracer.total_latency_ms
                await ticket_repo.update(ticket)
                await trace_repo.save(tracer)
                return ticket

            # Stage 5: RAG retrieval
            chunks = await self._stage_retrieve(ticket, classification, tracer)

            # Stage 6: LLM routing/decision
            decision = await self._stage_decide(ticket, classification, chunks, tracer)
            if decision is None:
                ticket.status = TicketStatus.AWAITING_REVIEW
                ticket.workflow_error = "Decision routing failed"
                return ticket

            ticket.proposed_action = decision.action
            ticket.action_confidence = decision.confidence
            ticket.action_reasoning = decision.reasoning

            # Stage 7: Draft response (only for auto_reply with sufficient confidence)
            if (
                decision.action == ActionType.AUTO_REPLY
                and decision.confidence >= settings.AUTO_REPLY_CONFIDENCE_THRESHOLD
            ):
                draft = await self._stage_draft(ticket, classification, chunks, tracer)
                if draft:
                    # Output guardrails
                    output_check = run_output_guardrails(
                        draft.body,
                        [c.model_dump() for c in draft.citations],
                    )
                    tracer.guardrail_results["output"] = {
                        "pii_in_draft": output_check.pii_in_draft,
                        "hallucination_flags": output_check.hallucination_flags,
                        "policy_violations": output_check.policy_violations,
                    }

                    if not output_check.passed:
                        # Output guardrail failed — downgrade to human review
                        logger.warning(
                            "output_guardrail_failed",
                            violations=output_check.policy_violations,
                        )
                        ticket.proposed_action = ActionType.ESCALATE_MANAGEMENT
                        ticket.action_reasoning += " (Output guardrail prevented auto-reply)"
                    else:
                        ticket.draft_response = output_check.cleaned_draft
                        ticket.draft_citations = [c.model_dump() for c in draft.citations]
                        ticket.draft_version = 1

            ticket.status = TicketStatus.AWAITING_REVIEW
            ticket.workflow_trace_id = tracer.trace_id
            ticket.processing_duration_ms = tracer.total_latency_ms
            ticket.token_count_total = tracer.total_tokens
            tracer.had_retries = tracer.retry_count > 0

            await ticket_repo.update(ticket)
            await trace_repo.save(tracer)
            return ticket

        except Exception as e:
            logger.error("workflow_fatal_error", error=str(e), ticket_id=str(ticket.id))
            ticket.status = TicketStatus.AWAITING_REVIEW
            ticket.workflow_error = f"Fatal workflow error: {str(e)[:500]}"
            ticket.workflow_trace_id = tracer.trace_id
            ticket.processing_duration_ms = tracer.total_latency_ms
            try:
                await ticket_repo.update(ticket)
                await trace_repo.save(tracer)
            except Exception as persist_err:
                logger.error("failed_to_persist_error_state", error=str(persist_err))
            return ticket

    async def _stage_input_guardrails(self, ticket: Ticket, tracer: WorkflowTracer) -> None:
        with StepTimer(tracer, "input_guardrails") as timer:
            result = run_input_guardrails(ticket.subject, ticket.body_raw)
            tracer.guardrail_results["input"] = result.to_dict()
            tracer.pii_detected = bool(result.pii_types_found)
            tracer.injection_detected = result.injection_detected
            timer.set_details(
                injection_detected=result.injection_detected,
                pii_found=result.pii_types_found,
            )

            if result.sanitized_text:
                ticket.body_sanitized = result.sanitized_text

    async def _stage_enrich(
        self, ticket: Ticket, session: AsyncSession, tracer: WorkflowTracer
    ) -> None:
        with StepTimer(tracer, "customer_enrichment") as timer:
            customer_repo = CustomerRepository(session)
            account = await customer_repo.get_by_email(ticket.customer_email)
            if account:
                ticket.customer_id = account.id
                ticket.customer_tier = account.tier
                ticket.account_metadata = {
                    "name": account.name,
                    "company": account.company,
                    "tier": account.tier.value if account.tier else "free",
                    "account_age_days": account.account_age_days,
                    "mrr_usd": account.mrr_usd,
                    "open_tickets": account.open_tickets,
                    "lifetime_tickets": account.lifetime_tickets,
                }
                timer.set_details(found=True, tier=account.tier.value if account.tier else "free")
            else:
                timer.set_details(found=False)

    async def _stage_classify(
        self, ticket: Ticket, tracer: WorkflowTracer
    ) -> Optional[ClassificationOutput]:
        prompt_def = get_prompt("classification")

        customer_tier = (
            ticket.customer_tier.value if ticket.customer_tier else "unknown"
        )

        user_prompt = prompt_def.user_template.format(
            subject=ticket.subject,
            body=ticket.body_sanitized[:3000],  # Truncate — classifier doesn't need full body
            customer_email=ticket.customer_email,
            customer_tier=customer_tier,
        )

        tracer.classification_prompt = f"SYSTEM:\n{prompt_def.system}\n\nUSER:\n{user_prompt}"
        tracer.classification_prompt_version = prompt_def.version

        with StepTimer(tracer, "classification") as timer:
            try:
                parsed, tokens, had_retries = await self.ollama.generate_structured(
                    model=settings.CLASSIFIER_MODEL,
                    prompt=user_prompt,
                    schema=ClassificationOutput,
                    system=prompt_def.system,
                    temperature=0.05,
                )
                if had_retries:
                    tracer.retry_count += 1
                    tracer.had_retries = True

                tracer.classification_latency_ms = int(time.monotonic() * 1000)
                tracer.classification_tokens = tokens
                tracer.classification_raw_output = str(parsed.model_dump())

                # Update ticket with classification
                ticket.category = parsed.category
                ticket.urgency_score = parsed.urgency_score
                ticket.sentiment_score = parsed.sentiment_score
                ticket.spam_probability = parsed.spam_probability
                ticket.escalation_risk = parsed.escalation_risk
                ticket.legal_sensitivity = parsed.legal_sensitivity
                ticket.classification_confidence = parsed.confidence
                ticket.classification_raw = parsed.model_dump()

                if parsed.customer_tier_guess != "unknown" and not ticket.customer_tier:
                    try:
                        ticket.customer_tier = CustomerTier(parsed.customer_tier_guess)
                    except ValueError:
                        pass

                timer.set_details(
                    category=parsed.category,
                    urgency=parsed.urgency_score,
                    confidence=parsed.confidence,
                    had_retries=had_retries,
                )
                return parsed

            except (SchemaValidationError, LLMCallError) as e:
                timer.mark_error()
                logger.error("classification_failed", error=str(e))
                return None

    async def _stage_retrieve(
        self,
        ticket: Ticket,
        classification: ClassificationOutput,
        tracer: WorkflowTracer,
    ) -> list[RetrievedChunk]:
        with StepTimer(tracer, "retrieval") as timer:
            start = time.monotonic()

            # Build a rich query from subject + first 200 chars of body
            query = f"{ticket.subject}. {ticket.body_sanitized[:200]}"

            # Retrieve relevant help articles
            chunks = self.retrieval.retrieve(
                query=query,
                source_types=["help_article", "internal_doc"],
            )

            # Always fetch customer's past ticket history (deterministic, not semantic)
            history = self.retrieval.get_customer_history(
                customer_email=ticket.customer_email,
                limit=2,
            )
            chunks = list(history) + chunks

            retrieval_ms = int((time.monotonic() - start) * 1000)
            tracer.retrieval_latency_ms = retrieval_ms
            tracer.retrieved_chunks = [c.model_dump() for c in chunks]
            tracer.reranker_scores = [c.reranker_score for c in chunks if c.reranker_score]

            timer.set_details(chunks_retrieved=len(chunks), retrieval_ms=retrieval_ms)
            return chunks

    async def _stage_decide(
        self,
        ticket: Ticket,
        classification: ClassificationOutput,
        chunks: list[RetrievedChunk],
        tracer: WorkflowTracer,
    ) -> Optional[DecisionOutput]:
        prompt_def = get_prompt("routing")

        context_summary = _format_retrieved_context(chunks[:3])  # Brief summary for routing

        user_prompt = prompt_def.user_template.format(
            category=classification.category,
            urgency_score=classification.urgency_score,
            sentiment_score=classification.sentiment_score,
            escalation_risk=classification.escalation_risk,
            legal_sensitivity=classification.legal_sensitivity,
            customer_tier=ticket.customer_tier.value if ticket.customer_tier else "unknown",
            spam_probability=classification.spam_probability,
            confidence=classification.confidence,
            context_summary=context_summary[:500],
            subject=ticket.subject,
        )

        tracer.routing_prompt = f"SYSTEM:\n{prompt_def.system}\n\nUSER:\n{user_prompt}"
        tracer.routing_prompt_version = prompt_def.version

        with StepTimer(tracer, "routing") as timer:
            try:
                parsed, _, had_retries = await self.ollama.generate_structured(
                    model=settings.ROUTER_MODEL,
                    prompt=user_prompt,
                    schema=DecisionOutput,
                    system=prompt_def.system,
                    temperature=0.1,
                )
                if had_retries:
                    tracer.retry_count += 1

                tracer.routing_raw_output = str(parsed.model_dump())
                timer.set_details(action=parsed.action.value, confidence=parsed.confidence)
                return parsed

            except (SchemaValidationError, LLMCallError) as e:
                timer.mark_error()
                logger.error("routing_failed", error=str(e))
                # Fallback: human review
                return DecisionOutput(
                    action=ActionType.ESCALATE_MANAGEMENT,
                    confidence=0.0,
                    reasoning=f"Routing model failed: {str(e)[:100]}. Escalated for human review.",
                )

    async def _stage_draft(
        self,
        ticket: Ticket,
        classification: ClassificationOutput,
        chunks: list[RetrievedChunk],
        tracer: WorkflowTracer,
    ) -> Optional[DraftResponse]:
        prompt_def = get_prompt("drafting")

        account_meta = ticket.account_metadata or {}
        retrieved_context = _format_retrieved_context(chunks)

        user_prompt = prompt_def.user_template.format(
            subject=ticket.subject,
            customer_email=ticket.customer_email,
            body=ticket.body_sanitized[:2000],
            customer_tier=ticket.customer_tier.value if ticket.customer_tier else "free",
            account_age=f"{account_meta.get('account_age_days', 'unknown')} days",
            open_tickets=account_meta.get('open_tickets', 'unknown'),
            retrieved_context=retrieved_context,
        )

        tracer.drafting_prompt = f"SYSTEM:\n{prompt_def.system}\n\nUSER:\n{user_prompt}"
        tracer.drafting_prompt_version = prompt_def.version

        with StepTimer(tracer, "drafting") as timer:
            try:
                text, tokens = await self.ollama.generate_draft(
                    prompt=user_prompt,
                    system=prompt_def.system,
                )
                tracer.drafting_tokens = tokens
                tracer.drafting_raw_output = text

                word_count = len(text.split())
                timer.set_details(word_count=word_count, tokens=tokens)

                return DraftResponse(
                    body=text,
                    citations=chunks[:3],  # Top-k citations used
                    tone="professional",
                    word_count=word_count,
                    prompt_version=prompt_def.version,
                )

            except (LLMCallError, Exception) as e:
                timer.mark_error()
                logger.error("drafting_failed", error=str(e))
                return None
