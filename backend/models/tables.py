from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db import Base


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    tier = Column(String(50), default="standard")
    profile_metadata = Column(Text, nullable=True)
    tickets = relationship("Ticket", back_populates="customer")


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    subject = Column(String(400), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="open")
    ai_decision = Column(String(50), nullable=True)
    ai_confidence = Column(String(50), nullable=True)
    is_spam = Column(Boolean, default=False)
    ai_draft = Column(Text, nullable=True)
    ai_citations = Column(Text, nullable=True)
    customer = relationship("Customer", back_populates="tickets")


class HelpArticle(Base):
    __tablename__ = "help_articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(400), nullable=False)
    slug = Column(String(200), nullable=False, unique=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(200), nullable=True)
    role = Column(String(50), default="agent")
    password_hash = Column(String(200), nullable=False)


class Trace(Base):
    __tablename__ = "traces"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, nullable=True)
    run_id = Column(String(100), nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)


class TraceEvent(Base):
    __tablename__ = "trace_events"
    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(Integer, ForeignKey("traces.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    step = Column(String(200), nullable=False)
    detail = Column(Text, nullable=True)
    trace = relationship("Trace", backref="events")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    reviewer = Column(String(120), nullable=False)
    decision = Column(String(40), nullable=False)
    note = Column(Text, nullable=True)
    edited_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True, index=True)
    dataset = Column(String(120), nullable=False, default="production")
    model_version = Column(String(120), nullable=True)
    prompt_version = Column(String(120), nullable=True)
    groundedness = Column(Float, nullable=True)
    hallucination_rate = Column(Float, nullable=True)
    judge_score = Column(Float, nullable=True)
    retrieval_precision = Column(Float, nullable=True)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(String(60), nullable=False)
    prompt = Column(Text, nullable=False)
    author = Column(String(120), nullable=False)
    status = Column(String(40), nullable=False, default="draft")
    deployed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(120), nullable=False)
    action = Column(String(120), nullable=False)
    entity = Column(String(120), nullable=False)
    entity_id = Column(String(120), nullable=True)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class AppSetting(Base):
    __tablename__ = "app_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(120), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_by = Column(String(120), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)


class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    key_hash = Column(String(240), nullable=False)
    created_by = Column(String(120), nullable=False)
    last_rotated_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=True)
    email = Column(String(200), nullable=False, index=True)
    company = Column(String(200), nullable=True)
    source = Column(String(80), nullable=False, default="website")
    created_at = Column(DateTime, default=datetime.utcnow)
