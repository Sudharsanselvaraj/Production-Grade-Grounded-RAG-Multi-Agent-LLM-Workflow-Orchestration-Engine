from datetime import datetime, timedelta
import hashlib
import json
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from ..auth.session import get_current_user, require_lead
from ..db import SessionLocal
from ..models.tables import (
    ApiKey,
    AppSetting,
    AuditLog,
    Customer,
    EvaluationRun,
    Lead,
    PromptVersion,
    Review,
    Ticket,
    Trace,
    TraceEvent,
    User,
)
from ..services.classifier import ClassificationError, classify_ticket

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _audit(db: Session, actor: str, action: str, entity: str, entity_id: Optional[str] = None, detail: Optional[dict] = None):
    row = AuditLog(
        actor=actor,
        action=action,
        entity=entity,
        entity_id=entity_id,
        detail=json.dumps(detail or {}),
        created_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()


def _ticket_code(ticket_id: int) -> str:
    return f"TKT-{ticket_id}"


def _parse_ticket_code(ticket_ref: str) -> int:
    if ticket_ref.isdigit():
        return int(ticket_ref)
    if ticket_ref.upper().startswith("TKT-"):
        suffix = ticket_ref.split("-", 1)[1]
        if suffix.isdigit():
            return int(suffix)
    raise HTTPException(status_code=400, detail="invalid ticket id")


def _safe_float(v, default: float = 0.0) -> float:
    try:
        return float(v)
    except Exception:
        return default


def _serialize_ticket(ticket: Ticket):
    customer_name = ticket.customer.name if ticket.customer else "Unknown"
    customer_email = ticket.customer.email if ticket.customer else ""
    confidence = _safe_float(ticket.ai_confidence, 0.0)
    return {
        "id": _ticket_code(ticket.id),
        "ticket_id": ticket.id,
        "customer": customer_name,
        "email": customer_email,
        "subject": ticket.subject,
        "message": ticket.body,
        "status": (ticket.status or "open").lower(),
        "priority": "high" if confidence >= 0.9 else "medium" if confidence >= 0.75 else "low",
        "sentiment": "negative" if "refund" in (ticket.body or "").lower() else "neutral",
        "intent": ticket.ai_decision or "unknown",
        "aiConfidence": confidence,
        "createdAt": ticket.created_at.isoformat() if ticket.created_at else None,
        "reasoning": ticket.ai_draft,
        "citations": json.loads(ticket.ai_citations) if ticket.ai_citations else [],
    }


class TrialStartIn(BaseModel):
    organization_name: str
    admin_email: EmailStr
    admin_name: str


class DemoLeadIn(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    company: Optional[str] = None


class TicketCreateIn(BaseModel):
    customer: str
    email: EmailStr
    subject: str
    message: str


class ReviewActionIn(BaseModel):
    note: Optional[str] = None
    edited_response: Optional[str] = None


class PromptCreateIn(BaseModel):
    name: str
    version: str
    prompt: str


class PromptDeployIn(BaseModel):
    prompt_id: int


class AdminSettingsIn(BaseModel):
    pii_masking: bool
    human_review_threshold: float
    hallucination_prevention: bool
    token_spending_limit: float


class ApiKeyCreateIn(BaseModel):
    name: str


class EvalRunIn(BaseModel):
    dataset: str = "FAQ"
    prompt_version: Optional[str] = None
    model_version: Optional[str] = "gpt-4o"


@router.post("/landing/trial")
def start_trial(payload: TrialStartIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.admin_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="admin already exists")

    user = User(
        username=payload.admin_email,
        full_name=payload.admin_name,
        role="lead",
        password_hash=hashlib.sha256(secrets.token_hex(16).encode("utf-8")).hexdigest(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _audit(db, payload.admin_email, "trial_started", "organization", entity_id=payload.organization_name)
    return {
        "workspace": payload.organization_name,
        "admin_user": payload.admin_email,
        "redirect": "/onboarding",
    }


@router.post("/landing/demo")
def book_demo(payload: DemoLeadIn, db: Session = Depends(get_db)):
    lead = Lead(name=payload.name, email=payload.email, company=payload.company, source="book_demo")
    db.add(lead)
    db.commit()
    db.refresh(lead)
    _audit(db, payload.email, "demo_booked", "lead", entity_id=str(lead.id), detail=payload.model_dump())
    return {
        "lead_id": lead.id,
        "status": "scheduled",
        "message": "Confirmation queued",
    }


@router.get("/dashboard/metrics")
def dashboard_metrics(
    window: str = Query("7d", pattern="^(24h|7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    now = datetime.utcnow()
    delta_map = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30), "90d": timedelta(days=90)}
    since = now - delta_map[window]

    active_tickets = (
        db.query(func.count(Ticket.id))
        .filter(and_(Ticket.created_at >= since, Ticket.status.in_(["open", "review", "needs_review", "in_progress"])))
        .scalar()
    ) or 0

    resolved_total = (
        db.query(func.count(Ticket.id)).filter(and_(Ticket.created_at >= since, Ticket.status == "resolved")).scalar()
    ) or 0
    resolved_ai = (
        db.query(func.count(Ticket.id))
        .filter(and_(Ticket.created_at >= since, Ticket.status == "resolved", Ticket.ai_decision.in_(["auto_reply", "close_spam"])))
        .scalar()
    ) or 0

    review_total = db.query(func.count(Review.id)).filter(Review.created_at >= since).scalar() or 0
    overrides = (
        db.query(func.count(Review.id))
        .filter(and_(Review.created_at >= since, Review.decision.in_(["reject", "edit", "escalate"])))
        .scalar()
    ) or 0

    groundedness = db.query(func.avg(EvaluationRun.groundedness)).filter(EvaluationRun.created_at >= since).scalar() or 0.0
    retrieval_precision = db.query(func.avg(EvaluationRun.retrieval_precision)).filter(EvaluationRun.created_at >= since).scalar() or 0.0
    avg_latency = db.query(func.avg(EvaluationRun.latency_ms)).filter(EvaluationRun.created_at >= since).scalar() or 0.0

    return {
        "window": window,
        "activeTickets": int(active_tickets),
        "aiResolutionRate": round((resolved_ai / resolved_total) if resolved_total else 0.0, 4),
        "humanOverrideRate": round((overrides / review_total) if review_total else 0.0, 4),
        "groundedness": round(float(groundedness), 4),
        "avgLatencyMs": round(float(avg_latency), 2),
        "retrievalPrecision": round(float(retrieval_precision), 4),
    }


@router.get("/dashboard/charts")
def dashboard_charts(
    window: str = Query("7d", pattern="^(24h|7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    now = datetime.utcnow()
    delta_map = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30), "90d": timedelta(days=90)}
    since = now - delta_map[window]

    runs = (
        db.query(EvaluationRun)
        .filter(EvaluationRun.created_at >= since)
        .order_by(EvaluationRun.created_at.asc())
        .all()
    )
    if not runs:
        return {"accuracy": [], "hallucinationRate": [], "costPerTicket": []}

    accuracy = []
    hallucination = []
    cost = []
    for run in runs:
        label = run.created_at.strftime("%b %d")
        accuracy.append({"name": label, "value": round((run.groundedness or 0) * 100, 2)})
        hallucination.append({"name": label, "value": round((run.hallucination_rate or 0) * 100, 2)})
        cost.append({"name": label, "cost": round(((run.latency_ms or 0) / 1000.0) * 0.0015, 4)})

    return {"accuracy": accuracy, "hallucinationRate": hallucination, "costPerTicket": cost}


@router.get("/dashboard/feed")
def dashboard_feed(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    out = []
    for log in logs:
        out.append(
            {
                "id": log.id,
                "type": log.entity,
                "title": f"{log.action.replace('_', ' ').title()} ({log.entity})",
                "description": log.detail or "",
                "time": log.created_at.isoformat() if log.created_at else None,
            }
        )
    return {"items": out}


@router.get("/tickets/queue")
def ticket_queue(
    q: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(priority|confidence|customer|date|status|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = 0,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(Ticket).outerjoin(Customer, Ticket.customer_id == Customer.id)

    if q:
        pattern = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Ticket.subject).like(pattern),
                func.lower(Ticket.body).like(pattern),
                func.lower(func.coalesce(Ticket.ai_decision, "")).like(pattern),
                func.lower(func.coalesce(Customer.name, "")).like(pattern),
            )
        )
    if status and status.lower() != "all":
        query = query.filter(func.lower(Ticket.status) == status.lower().replace(" ", "_"))
    if customer:
        query = query.filter(func.lower(func.coalesce(Customer.name, "")).like(f"%{customer.lower()}%"))

    tickets = query.all()
    serialized = [_serialize_ticket(t) for t in tickets]
    if priority and priority.lower() != "all":
        serialized = [t for t in serialized if t["priority"] == priority.lower()]

    if sort_by == "confidence":
        serialized = sorted(serialized, key=lambda x: x["aiConfidence"], reverse=(sort_order == "desc"))
    elif sort_by == "customer":
        serialized = sorted(serialized, key=lambda x: x["customer"].lower(), reverse=(sort_order == "desc"))
    elif sort_by == "status":
        serialized = sorted(serialized, key=lambda x: x["status"], reverse=(sort_order == "desc"))
    elif sort_by == "priority":
        rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        serialized = sorted(serialized, key=lambda x: rank.get(x["priority"], 0), reverse=(sort_order == "desc"))
    else:
        serialized = sorted(serialized, key=lambda x: x["createdAt"] or "", reverse=(sort_order == "desc"))

    total = len(serialized)
    page_items = serialized[skip : skip + limit]
    summary = {
        "open": sum(1 for t in serialized if t["status"] == "open"),
        "needsReview": sum(1 for t in serialized if t["status"] in ["needs_review", "review"]),
        "resolved": sum(1 for t in serialized if t["status"] == "resolved"),
    }
    return {"tickets": page_items, "total": total, "summary": summary}


@router.post("/tickets")
def create_ticket(payload: TicketCreateIn, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if not customer:
        customer = Customer(name=payload.customer, email=payload.email, tier="standard")
        db.add(customer)
        db.commit()
        db.refresh(customer)

    ticket = Ticket(customer_id=customer.id, subject=payload.subject, body=payload.message, status="open")
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    try:
        classify_ticket(db, ticket)
    except ClassificationError:
        pass

    _audit(db, current_user.get("sub", "system"), "ticket_created", "ticket", entity_id=str(ticket.id), detail={"subject": ticket.subject})
    return {"ticket": _serialize_ticket(ticket)}


@router.get("/tickets/{ticket_ref}/detail")
def ticket_detail(ticket_ref: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    ticket_id = _parse_ticket_code(ticket_ref)
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="ticket not found")

    traces = db.query(Trace).filter(Trace.ticket_id == ticket_id).order_by(Trace.start_time.desc()).all()
    trace_payload = []
    for trace in traces:
        events = db.query(TraceEvent).filter(TraceEvent.trace_id == trace.id).order_by(TraceEvent.timestamp.asc()).all()
        trace_payload.append(
            {
                "id": trace.id,
                "startTime": trace.start_time.isoformat() if trace.start_time else None,
                "endTime": trace.end_time.isoformat() if trace.end_time else None,
                "summary": trace.summary,
                "spans": [
                    {
                        "id": event.id,
                        "name": event.step,
                        "detail": event.detail,
                        "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                    }
                    for event in events
                ],
            }
        )

    reviews = db.query(Review).filter(Review.ticket_id == ticket_id).order_by(Review.created_at.desc()).all()
    return {
        "ticket": _serialize_ticket(ticket),
        "traces": trace_payload,
        "reviews": [
            {
                "id": review.id,
                "reviewer": review.reviewer,
                "decision": review.decision,
                "note": review.note,
                "edited_response": review.edited_response,
                "createdAt": review.created_at.isoformat() if review.created_at else None,
            }
            for review in reviews
        ],
    }


@router.get("/reviews/queue")
def reviews_queue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.status.in_(["review", "needs_review", "open"]))
        .order_by(Ticket.created_at.desc())
        .all()
    )
    rows = []
    for ticket in tickets:
        confidence = _safe_float(ticket.ai_confidence, 0.0)
        if ticket.status in ("review", "needs_review") or confidence < 0.80:
            rows.append(_serialize_ticket(ticket))

    approved_today = (
        db.query(func.count(Review.id))
        .filter(and_(Review.decision == "approve", Review.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)))
        .scalar()
    ) or 0
    return {"tickets": rows, "approvedToday": int(approved_today)}


@router.post("/reviews/{ticket_ref}/{action}")
def review_action(
    ticket_ref: str,
    action: str,
    payload: ReviewActionIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    action = action.lower()
    if action not in {"approve", "reject", "edit", "escalate"}:
        raise HTTPException(status_code=400, detail="invalid action")

    ticket_id = _parse_ticket_code(ticket_ref)
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="ticket not found")

    if action == "approve":
        ticket.status = "resolved"
        # Mark explicit AI resolution when human approved generated action.
        if not ticket.ai_decision:
            ticket.ai_decision = "auto_reply"
    elif action == "reject":
        ticket.status = "in_progress"
    elif action == "edit":
        ticket.status = "resolved"
        if payload.edited_response:
            ticket.ai_draft = payload.edited_response
    else:
        ticket.status = "needs_review"

    review = Review(
        ticket_id=ticket.id,
        reviewer=current_user.get("sub", "unknown"),
        decision=action,
        note=payload.note,
        edited_response=payload.edited_response,
    )
    db.add(review)
    db.add(ticket)
    db.commit()

    _audit(
        db,
        current_user.get("sub", "system"),
        f"review_{action}",
        "ticket",
        entity_id=str(ticket.id),
        detail={"note": payload.note},
    )
    return {"ok": True, "ticket": _serialize_ticket(ticket)}


@router.get("/traces")
def traces_list(
    status: Optional[str] = None,
    agent: Optional[str] = None,
    min_latency: Optional[float] = None,
    date_from: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(Trace)
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from)
            query = query.filter(Trace.start_time >= dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="invalid date_from")

    traces = query.order_by(Trace.start_time.desc()).all()
    out = []
    for trace in traces:
        events = db.query(TraceEvent).filter(TraceEvent.trace_id == trace.id).all()
        latency_ms = 0.0
        if trace.start_time and trace.end_time:
            latency_ms = max((trace.end_time - trace.start_time).total_seconds() * 1000.0, 0.0)

        event_names = [e.step.lower() for e in events]
        if agent and not any(agent.lower() in n for n in event_names):
            continue
        if min_latency is not None and latency_ms < min_latency:
            continue
        if status == "completed" and not trace.end_time:
            continue
        if status == "running" and trace.end_time:
            continue

        out.append(
            {
                "id": trace.id,
                "ticketId": _ticket_code(trace.ticket_id) if trace.ticket_id else None,
                "status": "completed" if trace.end_time else "running",
                "latencyMs": round(latency_ms, 2),
                "startTime": trace.start_time.isoformat() if trace.start_time else None,
                "summary": trace.summary,
                "steps": len(events),
            }
        )
    return {"traces": out}


@router.get("/traces/{trace_id}/detail")
def trace_detail(trace_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    trace = db.query(Trace).filter(Trace.id == trace_id).first()
    if not trace:
        raise HTTPException(status_code=404, detail="trace not found")
    events = db.query(TraceEvent).filter(TraceEvent.trace_id == trace.id).order_by(TraceEvent.timestamp.asc()).all()

    latency_ms = 0.0
    if trace.start_time and trace.end_time:
        latency_ms = max((trace.end_time - trace.start_time).total_seconds() * 1000.0, 0.0)

    return {
        "trace": {
            "id": trace.id,
            "ticketId": _ticket_code(trace.ticket_id) if trace.ticket_id else None,
            "summary": trace.summary,
            "status": "completed" if trace.end_time else "running",
            "latencyMs": round(latency_ms, 2),
            "startTime": trace.start_time.isoformat() if trace.start_time else None,
            "endTime": trace.end_time.isoformat() if trace.end_time else None,
        },
        "events": [
            {
                "id": event.id,
                "step": event.step,
                "input": "",
                "output": event.detail or "",
                "tokens": 0,
                "model": "n/a",
                "cost": 0,
                "timestamp": event.timestamp.isoformat() if event.timestamp else None,
            }
            for event in events
        ],
    }


@router.delete("/traces/{trace_id}")
def delete_trace(trace_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    trace = db.query(Trace).filter(Trace.id == trace_id).first()
    if not trace:
        raise HTTPException(status_code=404, detail="trace not found")
    db.query(TraceEvent).filter(TraceEvent.trace_id == trace.id).delete()
    db.delete(trace)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "trace_deleted", "trace", entity_id=str(trace_id))
    return {"ok": True}


@router.get("/prompts")
def list_prompts(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    prompts = db.query(PromptVersion).order_by(PromptVersion.created_at.desc()).all()
    return {
        "prompts": [
            {
                "id": p.id,
                "name": p.name,
                "version": p.version,
                "prompt": p.prompt,
                "author": p.author,
                "status": p.status,
                "deployedAt": p.deployed_at.isoformat() if p.deployed_at else None,
                "createdAt": p.created_at.isoformat() if p.created_at else None,
            }
            for p in prompts
        ]
    }


@router.post("/prompts")
def create_prompt(payload: PromptCreateIn, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    row = PromptVersion(
        name=payload.name,
        version=payload.version,
        prompt=payload.prompt,
        author=current_user.get("sub", "unknown"),
        status="draft",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, current_user.get("sub", "system"), "prompt_created", "prompt", entity_id=str(row.id))
    return {"id": row.id}


@router.post("/prompts/deploy")
def deploy_prompt(payload: PromptDeployIn, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    target = db.query(PromptVersion).filter(PromptVersion.id == payload.prompt_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="prompt not found")

    db.query(PromptVersion).filter(PromptVersion.name == target.name, PromptVersion.status == "production").update(
        {"status": "archived"}, synchronize_session=False
    )
    target.status = "production"
    target.deployed_at = datetime.utcnow()
    db.add(target)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "prompt_deployed", "prompt", entity_id=str(target.id))
    return {"ok": True}


@router.post("/prompts/{prompt_id}/rollback")
def rollback_prompt(prompt_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    target = db.query(PromptVersion).filter(PromptVersion.id == prompt_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="prompt not found")
    target.status = "production"
    target.deployed_at = datetime.utcnow()
    db.add(target)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "prompt_rollback", "prompt", entity_id=str(target.id))
    return {"ok": True}


@router.get("/admin/settings")
def get_admin_settings(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    defaults = {
        "pii_masking": True,
        "human_review_threshold": 0.8,
        "hallucination_prevention": True,
        "token_spending_limit": 500.0,
    }
    rows = db.query(AppSetting).all()
    for row in rows:
        try:
            defaults[row.key] = json.loads(row.value)
        except Exception:
            defaults[row.key] = row.value

    return defaults


@router.put("/admin/settings")
def put_admin_settings(
    payload: AdminSettingsIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_lead),
):
    incoming = payload.model_dump()
    for key, value in incoming.items():
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if not row:
            row = AppSetting(key=key, value=json.dumps(value), updated_by=current_user.get("sub", "unknown"))
        else:
            row.value = json.dumps(value)
            row.updated_by = current_user.get("sub", "unknown")
            row.updated_at = datetime.utcnow()
        db.add(row)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "admin_settings_updated", "setting")
    return {"ok": True}


@router.get("/admin/audit-logs")
def admin_audit_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return {
        "logs": [
            {
                "id": row.id,
                "actor": row.actor,
                "action": row.action,
                "entity": row.entity,
                "entityId": row.entity_id,
                "detail": row.detail,
                "createdAt": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }


@router.post("/admin/api-keys")
def create_api_key(payload: ApiKeyCreateIn, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    raw = f"lum_{secrets.token_urlsafe(24)}"
    hashed = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    row = ApiKey(name=payload.name, key_hash=hashed, created_by=current_user.get("sub", "unknown"))
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, current_user.get("sub", "system"), "api_key_created", "api_key", entity_id=str(row.id))
    return {"id": row.id, "name": row.name, "key": raw}


@router.post("/admin/api-keys/{key_id}/rotate")
def rotate_api_key(key_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    row = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="api key not found")
    raw = f"lum_{secrets.token_urlsafe(24)}"
    row.key_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    row.last_rotated_at = datetime.utcnow()
    db.add(row)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "api_key_rotated", "api_key", entity_id=str(row.id))
    return {"id": row.id, "key": raw}


@router.post("/admin/api-keys/{key_id}/revoke")
def revoke_api_key(key_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_lead)):
    row = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="api key not found")
    row.revoked = True
    db.add(row)
    db.commit()
    _audit(db, current_user.get("sub", "system"), "api_key_revoked", "api_key", entity_id=str(row.id))
    return {"ok": True}


@router.get("/analytics/trends")
def analytics_trends(
    window: str = Query("30d", pattern="^(7d|30d|90d)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    delta_map = {"7d": timedelta(days=7), "30d": timedelta(days=30), "90d": timedelta(days=90)}
    since = datetime.utcnow() - delta_map[window]

    rows = db.query(EvaluationRun).filter(EvaluationRun.created_at >= since).order_by(EvaluationRun.created_at.asc()).all()
    return {
        "accuracyTrend": [{"name": r.created_at.strftime("%b %d"), "value": round((r.judge_score or 0) * 100, 2)} for r in rows],
        "hallucinationTrend": [{"name": r.created_at.strftime("%b %d"), "value": round((r.hallucination_rate or 0) * 100, 2)} for r in rows],
        "latencyTrend": [{"name": r.created_at.strftime("%b %d"), "value": round(r.latency_ms or 0, 2)} for r in rows],
        "groundednessTrend": [{"name": r.created_at.strftime("%b %d"), "value": round((r.groundedness or 0) * 100, 2)} for r in rows],
        "agentSuccessRate": [
            {
                "name": r.created_at.strftime("%b %d"),
                "value": round(max(0.0, 100.0 - ((r.hallucination_rate or 0) * 100.0)), 2),
            }
            for r in rows
        ],
    }


@router.get("/evaluations/runs")
def list_eval_runs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    rows = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).limit(limit).all()
    return {
        "runs": [
            {
                "id": r.id,
                "dataset": r.dataset,
                "modelVersion": r.model_version,
                "promptVersion": r.prompt_version,
                "groundedness": r.groundedness,
                "hallucinationRate": r.hallucination_rate,
                "judgeScore": r.judge_score,
                "retrievalPrecision": r.retrieval_precision,
                "latencyMs": r.latency_ms,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.post("/evaluations/run")
def run_evaluations(
    payload: EvalRunIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    from ..evals.run_evals import execute_evaluation_run

    try:
        run_record = execute_evaluation_run(
            db=db,
            dataset=payload.dataset,
            model_version=payload.model_version or "gpt-4o",
            prompt_version=payload.prompt_version or "v1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation execution failed: {e}")

    _audit(
        db,
        current_user.get("sub", "system"),
        "evaluation_run",
        "evaluation",
        entity_id=str(run_record.id),
        detail={"dataset": payload.dataset},
    )

    return {
        "runId": run_record.id,
        "groundedness": run_record.groundedness,
        "hallucinationRate": run_record.hallucination_rate,
        "judgeScore": run_record.judge_score,
        "retrievalPrecision": run_record.retrieval_precision,
        "latencyMs": run_record.latency_ms,
    }



@router.get("/evaluations/report")
def evaluation_report(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    runs = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).limit(30).all()
    if not runs:
        return {"summary": {}, "runs": []}
    return {
        "summary": {
            "avgGroundedness": sum((r.groundedness or 0.0) for r in runs) / len(runs),
            "avgHallucination": sum((r.hallucination_rate or 0.0) for r in runs) / len(runs),
            "avgJudge": sum((r.judge_score or 0.0) for r in runs) / len(runs),
        },
        "runs": [
            {
                "id": r.id,
                "dataset": r.dataset,
                "groundedness": r.groundedness,
                "hallucinationRate": r.hallucination_rate,
                "judgeScore": r.judge_score,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in runs
        ],
    }


import csv
import io
from fastapi import Response

@router.get("/evaluations/export")
def export_evaluations(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    runs = db.query(EvaluationRun).order_by(EvaluationRun.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Run ID", "Dataset", "Model Version", "Prompt Version",
        "Groundedness", "Hallucination Rate", "Judge Score",
        "Retrieval Precision", "Latency (ms)", "Created At"
    ])

    # Rows
    for r in runs:
        writer.writerow([
            r.id,
            r.dataset,
            r.model_version or "",
            r.prompt_version or "",
            f"{((r.groundedness or 0.0) * 100):.1f}%",
            f"{((r.hallucination_rate or 0.0) * 100):.1f}%",
            f"{((r.judge_score or 0.0) * 100):.1f}%",
            f"{(r.retrieval_precision or 0.0):.2f}",
            f"{round(r.latency_ms or 0.0)}ms",
            r.created_at.isoformat() if r.created_at else ""
        ])

    csv_data = output.getvalue()

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lumen_evaluations_report.csv"}
    )

