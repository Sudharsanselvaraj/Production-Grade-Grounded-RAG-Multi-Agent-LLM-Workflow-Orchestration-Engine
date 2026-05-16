"""
Lumen Support AI — Repositories
Data access layer. Business logic stays in workflows/services.
SQLAlchemy async queries.
"""

import uuid
from typing import Optional
from sqlalchemy import select, update, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.db_models import Ticket, WorkflowTrace, CustomerAccount, User, TicketStatus
from backend.observability.tracer import WorkflowTracer


class TicketRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, ticket: Ticket) -> Ticket:
        self.session.add(ticket)
        await self.session.flush()
        return ticket

    async def update(self, ticket: Ticket) -> Ticket:
        await self.session.merge(ticket)
        await self.session.flush()
        return ticket

    async def get_by_id(self, ticket_id: uuid.UUID) -> Optional[Ticket]:
        result = await self.session.execute(
            select(Ticket)
            .options(selectinload(Ticket.trace))
            .where(Ticket.id == ticket_id)
        )
        return result.scalar_one_or_none()

    async def list_queue(
        self,
        status: Optional[TicketStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Ticket], int]:
        query = select(Ticket).order_by(
            desc(Ticket.urgency_score),  # Urgent first
            desc(Ticket.created_at),
        )
        if status:
            query = query.where(Ticket.status == status)

        count_q = select(func.count()).select_from(Ticket)
        if status:
            count_q = count_q.where(Ticket.status == status)

        total = (await self.session.execute(count_q)).scalar()
        tickets = (await self.session.execute(query.limit(limit).offset(offset))).scalars().all()
        return list(tickets), total

    async def get_analytics(self) -> dict:
        """Aggregate stats for dashboard."""
        total = (await self.session.execute(select(func.count()).select_from(Ticket))).scalar()

        approved = (await self.session.execute(
            select(func.count()).select_from(Ticket).where(Ticket.status == TicketStatus.APPROVED)
        )).scalar()

        edited = (await self.session.execute(
            select(func.count()).select_from(Ticket).where(Ticket.status == TicketStatus.EDITED)
        )).scalar()

        escalated = (await self.session.execute(
            select(func.count()).select_from(Ticket).where(Ticket.status == TicketStatus.ESCALATED)
        )).scalar()

        spam = (await self.session.execute(
            select(func.count()).select_from(Ticket).where(Ticket.status == TicketStatus.SPAM)
        )).scalar()

        avg_ms = (await self.session.execute(
            select(func.avg(Ticket.processing_duration_ms))
        )).scalar() or 0

        # Category distribution
        cat_results = await self.session.execute(
            select(Ticket.category, func.count())
            .where(Ticket.category.isnot(None))
            .group_by(Ticket.category)
        )
        category_dist = {row[0]: row[1] for row in cat_results}

        avg_conf = (await self.session.execute(
            select(func.avg(Ticket.classification_confidence))
            .where(Ticket.classification_confidence.isnot(None))
        )).scalar() or 0

        human_overrides = edited + (await self.session.execute(
            select(func.count()).select_from(Ticket)
            .where(Ticket.human_override_action.isnot(None))
        )).scalar()

        return {
            "total_tickets": total,
            "auto_resolved": approved,
            "human_overrides": human_overrides,
            "escalated": escalated,
            "spam_caught": spam,
            "avg_processing_ms": float(avg_ms),
            "override_rate": human_overrides / max(total, 1),
            "auto_resolution_rate": approved / max(total, 1),
            "category_distribution": category_dist,
            "urgency_distribution": {},
            "avg_confidence": float(avg_conf),
        }

    async def check_duplicate(self, sender_email: str, subject: str) -> bool:
        """Basic deduplication: same sender + subject in last hour."""
        from datetime import datetime, timedelta
        from sqlalchemy import and_

        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        result = await self.session.execute(
            select(func.count()).select_from(Ticket).where(
                and_(
                    Ticket.sender_email == sender_email,
                    Ticket.subject == subject,
                    Ticket.created_at >= one_hour_ago,
                )
            )
        )
        return (result.scalar() or 0) > 0


class TraceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, tracer: WorkflowTracer) -> WorkflowTrace:
        data = tracer.to_db_dict()
        trace = WorkflowTrace(**data)
        self.session.add(trace)
        await self.session.flush()
        return trace


class CustomerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[CustomerAccount]:
        result = await self.session.execute(
            select(CustomerAccount).where(CustomerAccount.email == email)
        )
        return result.scalar_one_or_none()


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
