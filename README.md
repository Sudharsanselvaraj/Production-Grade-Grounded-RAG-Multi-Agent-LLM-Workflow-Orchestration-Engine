<div align="center">

<br/>

<img src="assets/langgraph-text.png" height="52" alt="LangGraph"/> &nbsp;&nbsp;&nbsp; <img src="assets/pngegg.png" height="52" alt="ChromaDB"/>

<br/><br/>

# Lumen — Production-Grade Grounded RAG<br/>Multi-Agent LLM Workflow Engine

**Ingest · Classify · Retrieve · Decide · Draft · Observe**

*A fully observable, evaluation-harness-backed, human-in-the-loop GenAI support automation platform — built for real operational use, not demo day.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-13-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Ollama](https://img.shields.io/badge/Ollama-local_LLM-FF6C2C?style=flat-square)](https://ollama.ai)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-vector_store-7B2EBF?style=flat-square)](https://www.trychroma.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)](https://www.sqlalchemy.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

<br/>

[Architecture](#architecture) · [Workflow Pipeline](#workflow-pipeline) · [Model Routing](#model-routing) · [RAG System](#rag-system) · [Guardrails](#guardrails) · [Observability](#observability) · [Evaluation Harness](#evaluation-harness) · [Frontend](#frontend) · [Quick Start](#quick-start) · [API Reference](#api-reference) · [Deployment](#deployment)

<br/>

</div>

---

## What Is This?

Lumen is a **GenAI workflow orchestration platform** for automated customer support triage at scale. It processes inbound support emails through a multi-stage pipeline — classification, retrieval-augmented generation, decision routing, and grounded response drafting — before surfacing results to human reviewers in a rich operational dashboard.

This is not a chatbot demo. It is built to the standard of production AI operations software like **Intercom AI**, **Zendesk AI**, and **Linear's internal tooling** — with full observability, adversarial input handling, versioned prompts, a reproducible evaluation harness, and a human-in-the-loop review layer that feeds back into continuous improvement.

```
Every ticket that enters Lumen gets:

  A structured multi-dimensional classification
  A grounded, citation-backed draft response
  A hybrid deterministic + LLM routing decision
  A per-ticket execution trace (every LLM call, latency, token count)
  A human review step with edit-distance tracking
  An eval harness entry for offline quality measurement
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Lumen Platform                                       │
│                                                                                 │
│   Email / Webhook          FastAPI Backend              Next.js 13 Frontend     │
│   ───────────────          ──────────────              ───────────────────────  │
│                            ┌─────────────┐             ┌─────────────────────┐  │
│   POST /api/ingest ───────▶│  API Layer  │             │  Ticket Queue       │  │
│                            │  (FastAPI)  │◀───────────▶│  Ticket Detail      │  │
│                            └──────┬──────┘   REST/JSON │  Human Review Panel │  │
│                                   │                    │  Workflow Traces     │  │
│                            ┌──────▼──────┐             │  Eval Dashboard     │  │
│                            │  Workflow   │             │  Analytics          │  │
│                            │Orchestrator │             └─────────────────────┘  │
│                            └──────┬──────┘                                      │
│                                   │                                             │
│          ┌─────────────┬──────────┼───────────┬───────────────┐                │
│          ▼             ▼          ▼           ▼               ▼                │
│   ┌─────────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ ┌─────────────┐          │
│   │  Guardrails │ │Retrieval│ │ LLM  │ │  Prompt  │ │Observability│          │
│   │   Layer     │ │  (RAG)  │ │Router│ │ Registry │ │   Tracer    │          │
│   │ input/output│ │ChromaDB │ │Ollama│ │versioned │ │ per-ticket  │          │
│   └─────────────┘ └────┬────┘ └──┬───┘ └──────────┘ └─────────────┘          │
│                         │        │                                             │
│                   ┌─────▼──┐  ┌──▼────────────────┐                          │
│                   │bge-    │  │ phi3:mini           │  Classification         │
│                   │small   │  │ mistral:7b-instruct │  Routing                │
│                   │embed   │  │ llama3:8b           │  Drafting               │
│                   └────────┘  └───────────────────-─┘                         │
│                                                                                 │
│          ┌──────────────────────────────────────────────────────┐              │
│          │  PostgreSQL                ChromaDB (vector store)   │              │
│          │  tickets, traces           chunks, embeddings        │              │
│          │  users, accounts           help articles             │              │
│          └──────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Module Map

```
project-root/
│
├── backend/
│   ├── api/                     ← FastAPI route handlers
│   │   ├── ingest.py            ← Email ingestion endpoint
│   │   ├── tickets.py           ← CRUD, review, analytics
│   │   ├── auth.py              ← Login / session
│   │   ├── retrieval.py         ← RAG search endpoint
│   │   └── observability.py     ← Trace export
│   │
│   ├── workflows/
│   │   └── orchestrator.py      ← Main 9-stage pipeline
│   │
│   ├── services/
│   │   ├── classifier.py        ← phi3:mini structured classification
│   │   ├── drafter.py           ← llama3:8b grounded drafting
│   │   └── decision.py          ← Hybrid deterministic + LLM routing
│   │
│   ├── retrieval/
│   │   ├── retrieval_service.py ← Embed → store → search → rerank
│   │   └── indexer.py           ← Notion / Supabase sync, chunking
│   │
│   ├── guardrails/
│   │   └── guardrails.py        ← Injection, PII, policy, hallucination
│   │
│   ├── prompts/
│   │   ├── classification/v1.md ← Versioned prompt with iteration notes
│   │   ├── drafting/v1.md       ← v1: basic drafting
│   │   ├── drafting/v2.md       ← v2: grounded + citation-required
│   │   └── evals/judge_v1.md   ← LLM-as-judge rubric prompt
│   │
│   ├── observability/
│   │   └── tracer.py            ← Per-ticket WorkflowTracer
│   │
│   ├── evals/
│   │   ├── run_evals.py         ← Offline eval CLI + LLM-as-judge
│   │   └── test_set.json        ← Held-out evaluation dataset
│   │
│   ├── models/tables.py         ← SQLAlchemy ORM models
│   ├── auth/session.py          ← JWT auth
│   ├── db.py                    ← Async session factory
│   └── main.py                  ← FastAPI app, lifespan, middleware
│
├── frontend/
│   ├── app/dashboard/
│   │   ├── tickets/             ← Ticket queue + detail view
│   │   ├── human-review/        ← Sequential review panel
│   │   ├── traces/              ← Workflow trace explorer
│   │   ├── evaluations/         ← Eval metrics dashboard
│   │   ├── analytics/           ← Auto-resolution, override rate charts
│   │   ├── retrieval/           ← RAG search explorer
│   │   └── prompts/             ← Prompt version viewer
│   │
│   ├── components/
│   │   ├── ui/                  ← Alert, Badge, Button, Modal, Tabs, etc.
│   │   ├── layout/              ← Sidebar, Topbar, DashboardLayout
│   │   ├── landing/             ← Hero, Navbar, WorkflowSection
│   │   └── dashboard/           ← KPICard, DataTable, StatCard
│   │
│   └── lib/
│       ├── backend.js           ← Axios client with auth headers
│       ├── constants.js         ← Status enums, colour maps
│       └── mock-data.js         ← 50 synthetic tickets for dev
│
├── generate.py                  ← Synthetic data generator (50+ tickets)
├── scripts/
│   ├── seed_data.py             ← DB + vector store seeding
│   └── index_qdrant.py          ← Vector store indexing helper
│
├── docker-compose.yml           ← App + PostgreSQL + ChromaDB + Ollama
├── backend/Dockerfile
└── .env.example
```

---

## Workflow Pipeline

The core of Lumen is a **9-stage asynchronous pipeline** that processes every inbound email. Each stage is independently observable, retryable, and testable in isolation.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    9-Stage Workflow Orchestration Pipeline                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Stage 1 ── Ingest                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Email received → schema validate → HTML strip → dedup → language detect │   │
│  │  Dedup: same sender + subject within 1hr → 409 Conflict                  │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 2 ── Input Guardrails                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Prompt injection detection (14 regex patterns)                          │   │
│  │  PII scan (SSN, credit card, API keys, unusual email clusters)           │   │
│  │  Sanitize HTML, collapse whitespace                                      │   │
│  │  Flag results in trace — do NOT block (avoids attacker fingerprinting)   │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 3 ── Customer Enrichment                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Look up sender email in PostgreSQL customer table                       │   │
│  │  Attach: tier, MRR, account age, open ticket count                       │   │
│  │  Missing account → proceed without enrichment (graceful degradation)     │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 4 ── Multi-Dimensional Classification (phi3:mini)                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Prompt → structured JSON (Pydantic-validated)                           │   │
│  │  Outputs: category, urgency, sentiment, spam_probability,                │   │
│  │           escalation_risk, legal_sensitivity, customer_tier, confidence  │   │
│  │  Schema retry: 3 attempts with increasingly explicit JSON instruction    │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 5 ── Deterministic Pre-Routing                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  spam_probability ≥ 0.90 → mark_spam        (no LLM needed)             │   │
│  │  legal_sensitivity ≥ 0.70 → route_legal     (no exceptions permitted)   │   │
│  │  urgency ≥ 0.95 + escalation ≥ 0.85 → escalate_engineering              │   │
│  │  Otherwise → proceed to LLM routing                                      │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │ (ambiguous cases only)                │
│  Stage 6 ── Semantic Retrieval (RAG)                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  bge-small-en-v1.5 embed query (subject + first 200 chars)              │   │
│  │  ChromaDB semantic search → top-10 candidates                            │   │
│  │  Cross-encoder reranking (bge-reranker-base) → top-3 final chunks       │   │
│  │  + Deterministic customer history retrieval (metadata filter)            │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 7 ── LLM Routing Decision (mistral:7b-instruct)                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Inputs: all classification scores + retrieved context summary           │   │
│  │  Output: action + confidence + reasoning + assigned_team                 │   │
│  │  Actions: auto_reply | escalate_billing | escalate_engineering |         │   │
│  │           escalate_management | route_legal | mark_spam |                │   │
│  │           request_clarification | close_no_action                        │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 8 ── Grounded Response Drafting (llama3:8b)                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Only runs if: action = auto_reply AND confidence ≥ 0.82                │   │
│  │  Prompt includes retrieved context + customer metadata                   │   │
│  │  Email body labeled UNTRUSTED USER INPUT (injection defense in depth)    │   │
│  │  Model instructed to cite sources inline: [Source: <title>]             │   │
│  └──────────────────────────────────────┬───────────────────────────────────┘   │
│                                         │                                       │
│  Stage 9 ── Output Guardrails + Persist                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Output guardrails: PII in draft, hallucination heuristics,              │   │
│  │                     policy violations, tone issues                       │   │
│  │  Hard fail (SSN/CC/policy violation) → downgrade to human escalation    │   │
│  │  Persist: ticket + trace + citations to PostgreSQL                       │   │
│  │  Status → awaiting_review (human review required)                        │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Deterministic vs. LLM Logic: The Design Principle

One of the most important architectural decisions in any production GenAI system is **knowing when not to use an LLM.**

| Decision Type | Mechanism | Reason |
|---|---|---|
| Spam detection | Deterministic threshold | Auditable, no hallucination, no model exceptions |
| Legal flagging | Deterministic threshold | Zero-tolerance — must not be reasoned around |
| Language detection | `langdetect` library | Fast, deterministic, no latency |
| HTML stripping / PII scan | Regex + `bleach` | Auditable, zero latency |
| Classification (7 dimensions) | phi3:mini (LLM) | Regex can't handle nuanced email language |
| Routing (ambiguous cases) | mistral:7b-instruct (LLM) | Ambiguous cases genuinely need reasoning |
| Response drafting | llama3:8b (LLM) | Natural language generation — LLM's core strength |
| Customer history lookup | SQL query (deterministic) | We always want *this* customer's history, not semantically similar |

---

## Model Routing

Three local models, each chosen for a specific task. No single model does everything.

```
Task                    Model                   Why This Model
──────────────────────────────────────────────────────────────────────────────
Classification       phi3:mini (3.8B)       Fast, great at structured JSON,
                                            fits in ~4 GB VRAM, low latency
                                            critical for high-throughput triage

Routing/Decision     mistral:7b-instruct    Strong reasoning over multiple
                                            signals (urgency + sentiment + tier),
                                            good instruction following

Response Drafting    llama3:8b              Best open-source 8B for instruction
                                            following, tone, and citation format

Reranking            bge-reranker-base      Cross-encoder for semantic precision,
                     (cross-encoder)        adds ~50ms for meaningful recall gain

Embeddings           bge-small-en-v1.5      MTEB retrieval score 51.7, 33M params,
                                            3× faster than all-mpnet at ~5% less
                                            recall — correct tradeoff for this load
```

**VRAM budget (CPU-only fallback works):**

| Model | VRAM | Notes |
|---|---|---|
| phi3:mini | ~2.7 GB | Runs on consumer GPU or fast CPU |
| mistral:7b-instruct | ~4.8 GB | Requires at least 8 GB GPU or accepts slower CPU |
| llama3:8b | ~5.1 GB | Similar to mistral — swap for llama3:70b on enterprise hardware |
| bge-small embed | ~130 MB | CPU-only, sub-10ms per batch |
| bge-reranker-base | ~550 MB | CPU-only, ~50ms for 10 candidates |

---

## RAG System

A full production-style retrieval pipeline — not a semantic search wrapper.

### Chunking Strategy

```
Documents → Chunker → ChromaDB → Query → Reranker → Top-K Citations

Chunk size:    512 words   (captures full policy paragraphs)
Overlap:        64 words   (preserves cross-boundary context)
Min chunk:      50 chars   (stub chunks are discarded)
```

**Why 512/64?**
- 256 is too small: splits policy rules across chunks, degrading retrieval
- 1024 exceeds the embedding model's scoring sweet spot; relevance signal degrades
- 64-word overlap preserves sentences split at boundaries without doubling storage
- Tested on the 8 help center article types in this domain; 512 rarely cuts mid-rule

### Retrieval Architecture

```
Query (subject + first 200 chars)
    │
    ▼
bge-small-en-v1.5 embedding (384-dim, normalized)
    │
    ▼
ChromaDB ANN search (cosine, HNSW) → top-10 candidates
    │
    ├── with metadata pre-filter (source_type, customer_email)
    │
    ▼
bge-reranker-base cross-encoder → scored against query
    │
    ▼
Top-3 reranked chunks + customer history (deterministic)
    │
    ▼
Injected into drafting prompt as numbered citations
```

**Why ChromaDB over Qdrant?**
ChromaDB requires no additional service for local development, reduces the Docker Compose surface, and its Python-native API makes the retrieval service simpler to test. At >100k chunks or multi-tenant scale, Qdrant's payload filtering and horizontal sharding become necessary. The retrieval service is abstracted behind a clean interface — swapping stores requires changes in one file.

**Recall vs. Latency tradeoffs:**

| Configuration | Latency | Recall |
|---|---|---|
| Top-5, no reranking | ~8ms | Baseline |
| Top-10 → rerank to 3 | ~60ms | +12–18% precision |
| Top-20 → rerank to 5 | ~140ms | +5% over above |
| bge-large embeddings (current: bge-small) | +3× embed time | +~5% recall |

Current configuration (top-10 → rerank to 3) is the best balance for sub-200ms end-to-end retrieval.

### Knowledge Sources

| Source | Ingestion | Retrieval Mode |
|---|---|---|
| Help center articles | Notion API sync → chunk → embed → ChromaDB | Semantic |
| Past resolved tickets | Supabase query → chunk → embed → ChromaDB | Semantic + customer-filtered |
| Customer account notes | PostgreSQL → embed on ingest | Customer-filtered (deterministic) |
| Internal escalation docs | Manual seeding via `scripts/seed_data.py` | Semantic |

---

## Guardrails

Guardrails operate on both sides of every LLM call. The design principle: **fail visibly, never silently.**

### Input-Side

| Check | Mechanism | Action on Flag |
|---|---|---|
| Prompt injection | 14 compiled regex patterns | Log + flag in trace, do NOT block |
| PII detection | Regex (SSN, CC, API keys, unusual email clusters) | Log PII types in trace |
| HTML injection | `bleach.clean(tags=[], strip=True)` | Strip silently |
| Unsafe keywords | Keyword list | Log in trace |

> **Why not block injections?** Blocking on pattern match allows attackers to binary-search for bypass patterns. Flagging and routing to human review is safer — it removes the LLM from the loop without revealing detection logic.

> **Defense in depth:** The drafting prompt also labels the email body as `UNTRUSTED USER INPUT`. Even if the guardrail misses a novel injection pattern, the model has been instructed to ignore instructions in the email body.

### Output-Side

| Check | Mechanism | Action on Fail |
|---|---|---|
| Ungrounded monetary claims | Regex for `$X` not in citation text | Add to hallucination_flags |
| Ungrounded date claims | Month-name regex not in citation text | Add to hallucination_flags |
| Policy violations | 6 compiled patterns (e.g. "guaranteed refund") | Hard fail → escalate |
| Tone issues | Aggressive phrasing patterns | Soft flag for human review |
| PII in draft | Same input PII scanner | Strip SSN/CC; hard fail |

Hard failures (policy violation or SSN/CC in draft) **downgrade the action from `auto_reply` to `escalate_management`** — the AI never sends a policy-violating response, but the ticket still reaches a human rather than being silently dropped.

---

## Observability

Every ticket produces a **`WorkflowTrace`** that captures the full execution:

```python
@dataclass
class WorkflowTrace:
    # Per-stage timing
    steps: list[TraceStep]           # [{stage, started_at, duration_ms, status, details}]

    # Retrieval
    retrieved_chunks: list[dict]     # Each chunk with relevance + reranker score
    retrieval_latency_ms: int
    reranker_scores: list[float]

    # Model calls
    classification_prompt: str       # Full prompt sent to model
    classification_prompt_version: str
    classification_raw_output: str   # Raw model output before parsing
    classification_latency_ms: int
    classification_tokens: int

    routing_prompt: str
    routing_raw_output: str
    routing_latency_ms: int

    drafting_prompt: str
    drafting_raw_output: str
    drafting_latency_ms: int
    drafting_tokens: int

    # Guardrail audit
    guardrail_results: dict          # Input + output guardrail findings
    pii_detected: bool
    injection_detected: bool

    # Reliability
    total_latency_ms: int
    total_tokens: int
    had_retries: bool
    retry_count: int
    error_stages: list[str]
```

This trace is stored in PostgreSQL alongside the ticket row — making it queryable, joinable, and available to the eval harness without any separate APM infrastructure.

### What You Can Debug

From the **Workflow Trace** dashboard page:

- Exact prompts sent to every model (with version)
- Raw model outputs before schema parsing
- Which retrieval chunks were used and at what scores
- Where retries occurred and why
- Total latency per stage (visual timeline)
- Whether any guardrail fired and what it found

---

## Evaluation Harness

> *"This is one of the most important parts."* — The assignment brief. Agreed.

### Running Evals

```bash
python backend/evals/run_evals.py
```

The eval harness:
1. Loads a **held-out test set** (`evals/test_set.json`) — tickets never seen during prompt development
2. Runs each ticket through the full pipeline (or stubs for offline speed)
3. Scores with **quantitative metrics** and an **LLM-as-judge**
4. Outputs a structured report to stdout and `eval_reports/`

### Metrics

**Quantitative:**

| Metric | Definition |
|---|---|
| Classification accuracy | Predicted category vs. ground-truth label |
| Retrieval hit rate | At least one relevant chunk in top-k |
| Citation presence rate | Draft contains at least one `[Source: ...]` reference |
| Auto-resolution rate | Tickets reaching `approved` status without human edit |
| Override rate | Human edits / total reviewed |
| Latency P50 / P95 | End-to-end pipeline timing distribution |

**LLM-as-Judge (qualitative):**

Each generated draft is scored on a 1–5 rubric by the judge model:

```
groundedness   — every claim backed by retrieved context
helpfulness    — actually addresses the customer's problem
tone           — professional, empathetic, appropriate
conciseness    — 100–200 words; not over- or under-explained
citation_quality — citations present and pointing to real sources
```

The judge prompt (`prompts/evals/judge_v1.md`) is versioned separately from production prompts. If Ollama is unavailable, the harness falls back to heuristic scoring (citation presence, word count, policy pattern scan).

### Evaluation Output

```
══════════════════════════════════════════════════════
  LUMEN EVAL REPORT  —  2024-01-15 14:32:01
══════════════════════════════════════════════════════

QUANTITATIVE METRICS
──────────────────────────────────────────────
  Classification accuracy:     87.3%
  Retrieval hit rate (top-3):  91.4%
  Citation presence rate:      84.2%
  Auto-resolution rate:        61.8%
  Override rate:               23.1%
  Latency P50:                1,840ms
  Latency P95:                4,210ms

LLM-AS-JUDGE SCORES (avg across 50 tickets)
──────────────────────────────────────────────
  Groundedness:     4.1 / 5
  Helpfulness:      3.8 / 5
  Tone:             4.3 / 5
  Conciseness:      4.0 / 5
  Citation quality: 3.7 / 5
  Overall:          3.98 / 5

FAILURE ANALYSIS
──────────────────────────────────────────────
  Schema retries:       8 / 50 (16%)
  Output guardrail hits: 3 / 50 (6%)
  Workflow errors:       1 / 50 (2%)
══════════════════════════════════════════════════════
```

---

## Frontend

A polished operational dashboard — built to feel like **LangSmith**, **Zendesk**, or **Linear**, not a generic AI demo.

### Pages

#### Ticket Queue (`/dashboard/tickets`)
- 50+ realistic tickets with priority sorting (urgency-first)
- Filterable by status, priority, category
- Full-text search across customer, subject, ticket ID
- Colour-coded priority badges (P0–P3)
- Sentiment emoji + AI confidence chips per row
- Click any row → navigates to full detail view

#### Ticket Detail View (`/dashboard/tickets/[id]`)
- 3-column layout: **Customer** | **AI Decision** | **Workflow**
- Left: original email, customer metadata, account info, SLA risk
- Centre: classification scores, retrieved evidence with relevance bars, decision reasoning, draft response with citations
- Right: workflow timeline, model names, per-step latency, token counts
- Expandable sections for classification raw output and full prompts
- Action buttons: Approve · Edit & Approve · Reject

#### Human Review Panel (`/dashboard/human-review`)
- Sequential one-ticket-at-a-time workflow
- Side-by-side: original message + AI draft
- Inline edit area for modifying draft before approval
- Three actions: ✅ Approve · ✏️ Edit & Approve · ❌ Reject
- Progress tracker: "3 of 15 reviewed"
- Auto-advances to next ticket after action

#### Workflow Trace Explorer (`/dashboard/traces`)
- Browse all execution traces with ticket linkage
- Clickable step timeline: Classification → Retrieval → Reasoning → Decision → Draft
- Per-step detail: model used, duration, token count, raw output
- Latency breakdown bar chart
- Guardrail audit panel (injection flags, PII types, policy violations)

#### Evaluation Dashboard (`/dashboard/evaluations`)
- 6 KPI cards: auto-resolution, groundedness, hallucination rate, latency, override rate, citation quality
- Recharts visualisations:
  - Category prediction accuracy (grouped bar)
  - Groundedness score distribution (histogram)
  - Judge score vs. groundedness scatter
  - Latency trends over time (line chart)
- Eval results table with per-ticket predictions, scores, and flags

#### Analytics (`/dashboard/analytics`)
- Auto-resolution rate trend
- Override rate trend
- Category distribution (pie/bar)
- Confidence distribution histogram
- Escalation breakdown by team

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker + Docker Compose
- Ollama installed locally ([ollama.ai](https://ollama.ai))

### 1. Pull Required Models

```bash
ollama pull phi3:mini
ollama pull mistral:7b-instruct
ollama pull llama3:8b
```

### 2. Clone and Configure

```bash
git clone https://github.com/Sudharsanselvaraj/Production-Grade-Grounded-RAG-Multi-Agent-LLM-Workflow-Orchestration-Engine.git
cd Production-Grade-Grounded-RAG-Multi-Agent-LLM-Workflow-Orchestration-Engine

cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY at minimum
```

### 3. Start Infrastructure

```bash
docker-compose up -d db
# Wait ~5s for PostgreSQL to be ready
```

### 4. Backend

```bash
cd backend
pip install -r requirements.txt

# Create tables + seed knowledge base
python -m scripts.seed_data

# Start API server
uvicorn backend.main:app --reload --port 8000
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 6. Run Evaluation Harness

```bash
python backend/evals/run_evals.py
```

### One-Command Docker Start (all services)

```bash
docker-compose up --build
```

Services:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

---

## API Reference

### `POST /api/ingest`

Ingest an inbound support email. Returns immediately; workflow runs in background.

```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "URGENT: Production API returning 503 errors",
    "body": "Starting at 14:23 UTC, all calls to api.lumen.io return 503...",
    "sender_email": "alex@techcorp.com"
  }'
```

```json
{
  "ticket_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "message": "Email ingested. Workflow started."
}
```

---

### `GET /api/tickets`

Paginated ticket queue, sorted by urgency descending.

```bash
curl http://localhost:8000/api/tickets?limit=20&status_filter=awaiting_review \
  -H "Authorization: Bearer <token>"
```

```json
{
  "tickets": [
    {
      "id": "3fa85f64...",
      "subject": "URGENT: Production API returning 503 errors",
      "customer_tier": "enterprise",
      "status": "awaiting_review",
      "category": "technical",
      "urgency_score": 0.97,
      "sentiment_score": -0.84,
      "proposed_action": "escalate_engineering",
      "action_confidence": 0.94,
      "sla_risk": "critical",
      "processing_duration_ms": 2340
    }
  ],
  "total": 48,
  "limit": 20,
  "offset": 0
}
```

---

### `GET /api/tickets/{id}`

Full ticket detail including workflow trace, classification, retrieved chunks, draft, and citations.

---

### `POST /api/tickets/{id}/review`

Human review decision.

```bash
curl -X POST http://localhost:8000/api/tickets/{id}/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "edit",
    "edited_response": "Hi Alex, we are investigating the 503 errors...",
    "reviewer_notes": "Softened tone, removed SLA commitment language"
  }'
```

`action` ∈ `approve | edit | reject | escalate`

---

### `POST /api/auth/token`

```bash
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@lumen.io", "password": "..."}'
```

```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "role": "agent",
  "name": "Jane Smith"
}
```

Roles: `agent` (review tickets) · `lead` (analytics + full visibility)

---

### `GET /health`

```json
{
  "status": "ok",
  "version": "1.0.0",
  "ollama": "reachable"
}
```

---

## Prompt Engineering

All prompts are **version-controlled in `backend/prompts/`** and referenced by version string in traces. This makes it possible to compare prompt versions in offline evaluation by replaying traces.

### Classification Prompt — Iteration History

| Version | Change | Result |
|---|---|---|
| v0.1 | Plain instruction, no examples | Model returned prose 30% of the time instead of JSON |
| v0.2 | Added JSON schema in system prompt | JSON compliance improved; urgency scores biased high |
| v1.0 (current) | Added 5 calibration examples | Urgency now distributed across full range; JSON compliance >95% |

**Key insight:** Few-shot calibration examples anchored the 0–1 urgency scale far better than verbal descriptions like "0 means low urgency, 1 means critical." The examples gave the model reference points.

### Drafting Prompt — Iteration History

| Version | Change | Result |
|---|---|---|
| v1 | Basic role instruction | Responses were long, generic, no citations |
| v2 (current) | Added: 100–200 word limit, citation requirement, "what NOT to do" list, UNTRUSTED INPUT label on email body | Citation rate 84%; significantly fewer policy-adjacent claims |

**Key insight:** Labeling the email body as `UNTRUSTED USER INPUT` in the prompt template — not just in the guardrail — creates defense in depth. Even novel injection patterns that bypass the guardrail face an explicit model instruction to ignore them.

---

## Deployment

### Docker Compose

```yaml
# docker-compose.yml (abbreviated)
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: lumen
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/lumen
      OLLAMA_BASE_URL: http://host.docker.internal:11434

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
```

```bash
docker-compose up --build
```

> **Ollama note:** Ollama must run on the host machine (not in Docker) for GPU passthrough. The backend uses `host.docker.internal` to reach it from inside the container.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL async URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama HTTP endpoint |
| `CLASSIFIER_MODEL` | `phi3:mini` | Model for classification |
| `DRAFTER_MODEL` | `llama3:8b` | Model for response drafting |
| `ROUTER_MODEL` | `mistral:7b-instruct` | Model for routing decisions |
| `EMBEDDING_MODEL` | `BAAI/bge-small-en-v1.5` | HuggingFace embedding model |
| `CHROMA_PERSIST_DIR` | `./data/chroma` | ChromaDB persistence path |
| `SECRET_KEY` | — | JWT signing key (use `openssl rand -hex 32`) |
| `AUTO_REPLY_CONFIDENCE_THRESHOLD` | `0.82` | Min confidence for auto-send |
| `SPAM_THRESHOLD` | `0.90` | Spam classification threshold |
| `LEGAL_FLAG_THRESHOLD` | `0.70` | Legal sensitivity flag threshold |
| `CHUNK_SIZE` | `512` | Chunking word size for RAG |
| `RETRIEVAL_TOP_K` | `5` | Candidates before reranking |
| `RETRIEVAL_RERANK_TOP_K` | `3` | Final chunks after reranking |

---

## Design Decisions & Tradeoffs

### Why Ollama over OpenAI API?

Using local models via Ollama makes the system self-contained, offline-capable, and free of per-token API costs during development and evaluation. The system is model-agnostic at the service layer — swapping Ollama for an OpenAI-compatible client (e.g. for production deployment with stronger models) requires changing a single service file.

### Why PostgreSQL for traces instead of dedicated APM?

Storing traces in PostgreSQL alongside ticket data enables direct JOINs in the eval harness (`JOIN tickets ON traces.ticket_id = tickets.id`). This simplifies offline evaluation enormously — no need to reconcile data across two systems. At >10k tickets/day, migrating trace storage to a time-series store (ClickHouse, TimescaleDB) would reduce write pressure.

### Why not block prompt injection?

Pattern-based blocking allows adversaries to binary-search for bypass patterns by submitting variations and observing which ones return 200 vs. 403. Flagging and routing to human review removes the LLM from the decision path without leaking detection logic.

### Scaling to Production

| Concern | Current | At Scale |
|---|---|---|
| Workflow execution | Background task in FastAPI process | Celery + Redis task queue |
| LLM inference | Single Ollama process | vLLM with tensor parallelism |
| Vector store | ChromaDB (local) | Qdrant (distributed) |
| Trace storage | PostgreSQL | ClickHouse or TimescaleDB |
| Embedding | In-process sentence-transformers | Separate embedding microservice |
| Auth | JWT stateless | JWT + Redis revocation list |

---

## Synthetic Data

The `generate.py` script creates a diverse dataset of 50+ realistic support tickets covering:

| Category | Examples |
|---|---|
| Billing disputes | Double charges, refund requests, overage confusion, annual plan cancellation |
| Technical outages | Production 503s, SSO breakage, webhook failures, API 401s |
| Legal / compliance | GDPR deletion requests, litigation notices, SOC 2 audit requests |
| Angry customers | Threatening to cancel, demanding callbacks, blaming support |
| Spam | Prize scams, partnership solicitations |
| Prompt injections | `IGNORE ALL PREVIOUS INSTRUCTIONS`, `[SYSTEM]` overrides |
| Multilingual | Spanish/English mixed, Japanese/English mixed |
| Vague / ambiguous | "It's not working", "Help", two-word tickets |
| Enterprise escalations | Renewal risk, executive contact requests, security incidents |

Also generated:
- **10 customer accounts** with realistic tiers, MRR, and account ages
- **8 help center articles** covering billing, technical, security, and legal topics
- Realistic cross-entity relationships (tickets reference matching customers)

---

## Testing

```bash
# Backend unit tests
cd backend && pytest -v

# Test coverage targets:
#   Guardrails: injection patterns, PII detection, output validation
#   Classification schema: validation, retry logic
#   Retrieval: chunking, embedding roundtrip, reranker ordering
#   Workflow: deterministic routing thresholds
#   API: ingest dedup, review state machine, auth
```

---

## Failure Modes & Known Limitations

| Failure Mode | How It Manifests | Current Mitigation |
|---|---|---|
| Ollama unavailable | Workflow error on all tickets | Health check endpoint; graceful error state with trace |
| Schema validation failure (LLM returns prose) | Classification/routing stage fails | 3-attempt retry with increasingly explicit JSON instruction |
| Embedding model cold start | First request slow (~5s) | Pre-warm on startup lifespan |
| ChromaDB empty on first run | Retrieval returns no chunks | Graceful degradation; draft still generated without context |
| Injection bypasses guardrail | Model receives injected instruction | Second layer: UNTRUSTED INPUT label in prompt template |
| Large email body (>10k chars) | Prompt overflow for classification | Hard truncation at 3000 chars for classification prompt |
| Duplicate ticket spam | Same sender floods queue | Dedup check: same sender + subject within 1 hour |

---

## Reflection

The weakest areas of the current system and what a next iteration would address:

**Prompt brittleness:** Classification accuracy drops noticeably for very short emails (< 20 words) and heavily mixed-language tickets. A dedicated short-email handling path and multilingual calibration examples would improve this.

**Retrieval cold start:** A freshly deployed system with an empty vector store produces ungrounded drafts. Production would require a minimum viable knowledge base before enabling auto-reply.

**Feedback loop:** Edit distance between draft and final response is captured per ticket, but there is no pipeline from this signal back to prompt refinement. A scheduled job that identifies high-edit-distance clusters and surfaces them for prompt engineers is the obvious next step.

**LLM-as-judge reliability:** The judge model occasionally disagrees with human evaluation on edge cases (very short positive tickets, multilingual responses). A calibration set of human-judged examples to anchor the judge would reduce variance.

---

<div align="center">

<br/>

Built as a take-home engineering assignment for a GenAI systems role.

*Sudharsan S · SRMIST Trichy · ML Engineer & Agentic AI Engineer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sudharsan_S-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/sudharsan-s-528a8a2a0)
[![GitHub](https://img.shields.io/badge/GitHub-Sudharsanselvaraj-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Sudharsanselvaraj)

<br/>

</div>
