"""
Lumen Support AI — Observability
Structured logging with structlog. Per-ticket trace recording.
Every LLM call, retrieval step, and decision is captured.

Design choice: We write traces to PostgreSQL (not a dedicated APM) because:
1. It keeps the stack simple (no Jaeger/Datadog required for local dev)
2. Traces are queryable alongside ticket data
3. The eval harness can JOIN tickets with traces for offline analysis
Tradeoff: At high scale (>10k tickets/day), we'd move to a time-series store.
"""

import time
import uuid
import structlog
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from backend.config import settings


# Configure structlog — JSON in production, pretty in dev
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer() if settings.DEBUG else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(settings.LOG_LEVEL),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


@dataclass
class TraceStep:
    """Single step in a workflow execution."""
    stage: str
    started_at: str
    duration_ms: int
    status: str  # success | error | skipped
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "stage": self.stage,
            "started_at": self.started_at,
            "duration_ms": self.duration_ms,
            "status": self.status,
            "details": self.details,
        }


class WorkflowTracer:
    """
    Per-ticket trace collector. Passed through the workflow pipeline.
    Accumulated in memory during processing, then persisted to DB at end.
    """

    def __init__(self, ticket_id: uuid.UUID):
        self.trace_id = uuid.uuid4()
        self.ticket_id = ticket_id
        self.steps: list[TraceStep] = []
        self.started_at = time.monotonic()

        # Retrieval
        self.retrieved_chunks: list[dict] = []
        self.retrieval_latency_ms: Optional[int] = None
        self.reranker_scores: list = []

        # Classification
        self.classification_prompt: Optional[str] = None
        self.classification_prompt_version: Optional[str] = None
        self.classification_raw_output: Optional[str] = None
        self.classification_latency_ms: Optional[int] = None
        self.classification_tokens: Optional[int] = None

        # Routing
        self.routing_prompt: Optional[str] = None
        self.routing_prompt_version: Optional[str] = None
        self.routing_raw_output: Optional[str] = None
        self.routing_latency_ms: Optional[int] = None

        # Drafting
        self.drafting_prompt: Optional[str] = None
        self.drafting_prompt_version: Optional[str] = None
        self.drafting_raw_output: Optional[str] = None
        self.drafting_latency_ms: Optional[int] = None
        self.drafting_tokens: Optional[int] = None

        # Guardrails
        self.guardrail_results: dict = {}
        self.pii_detected: bool = False
        self.injection_detected: bool = False

        # Errors
        self.had_retries: bool = False
        self.retry_count: int = 0
        self.error_stages: list[str] = []

        # Bind ticket ID to all log lines
        structlog.contextvars.bind_contextvars(ticket_id=str(ticket_id), trace_id=str(self.trace_id))

    def record_step(self, stage: str, duration_ms: int, status: str, **details) -> None:
        step = TraceStep(
            stage=stage,
            started_at=datetime.utcnow().isoformat(),
            duration_ms=duration_ms,
            status=status,
            details=details,
        )
        self.steps.append(step)
        logger.info("workflow_step", stage=stage, duration_ms=duration_ms, status=status, **details)

    @property
    def total_latency_ms(self) -> int:
        return int((time.monotonic() - self.started_at) * 1000)

    @property
    def total_tokens(self) -> int:
        return (self.classification_tokens or 0) + (self.drafting_tokens or 0)

    def to_db_dict(self) -> dict:
        """Serialize for DB persistence."""
        return {
            "id": self.trace_id,
            "ticket_id": self.ticket_id,
            "steps": [s.to_dict() for s in self.steps],
            "retrieved_chunks": self.retrieved_chunks,
            "retrieval_latency_ms": self.retrieval_latency_ms,
            "reranker_scores": self.reranker_scores,
            "classification_prompt": self.classification_prompt,
            "classification_prompt_version": self.classification_prompt_version,
            "classification_raw_output": self.classification_raw_output,
            "classification_latency_ms": self.classification_latency_ms,
            "classification_tokens": self.classification_tokens,
            "routing_prompt": self.routing_prompt,
            "routing_prompt_version": self.routing_prompt_version,
            "routing_raw_output": self.routing_raw_output,
            "routing_latency_ms": self.routing_latency_ms,
            "drafting_prompt": self.drafting_prompt,
            "drafting_prompt_version": self.drafting_prompt_version,
            "drafting_raw_output": self.drafting_raw_output,
            "drafting_latency_ms": self.drafting_latency_ms,
            "drafting_tokens": self.drafting_tokens,
            "guardrail_results": self.guardrail_results,
            "pii_detected": self.pii_detected,
            "injection_detected": self.injection_detected,
            "total_latency_ms": self.total_latency_ms,
            "total_tokens": self.total_tokens,
            "had_retries": self.had_retries,
            "retry_count": self.retry_count,
            "error_stages": self.error_stages,
        }


class StepTimer:
    """Context manager for timing a workflow step."""

    def __init__(self, tracer: WorkflowTracer, stage: str):
        self.tracer = tracer
        self.stage = stage
        self._start = None
        self._details: dict = {}
        self._status = "success"

    def set_details(self, **kwargs) -> None:
        self._details.update(kwargs)

    def mark_error(self) -> None:
        self._status = "error"

    def __enter__(self) -> "StepTimer":
        self._start = time.monotonic()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        duration_ms = int((time.monotonic() - self._start) * 1000)
        if exc_type is not None:
            self._status = "error"
            self._details["error"] = str(exc_val)
            self.tracer.error_stages.append(self.stage)
        self.tracer.record_step(self.stage, duration_ms, self._status, **self._details)
        # Don't suppress exceptions
        return False
