from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
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
