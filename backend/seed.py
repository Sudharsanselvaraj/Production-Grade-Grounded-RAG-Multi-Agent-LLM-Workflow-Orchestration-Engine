from backend.db import init_db, SessionLocal
from backend.models import tables
from datetime import datetime, timedelta
import random
import json


def seed():
    init_db()
    db = SessionLocal()
    try:
        # Customers
        customers = [
            tables.Customer(id=1, name='ACME Corp', email='acme@example.com', tier='enterprise'),
            tables.Customer(id=2, name='Demo Org', email='demo@example.com', tier='standard'),
            tables.Customer(id=3, name='Beta Retail', email='beta@retail.example', tier='standard'),
            tables.Customer(id=4, name='Supportly', email='hello@supportly.io', tier='enterprise'),
        ]
        for c in customers:
            db.merge(c)
        db.commit()

        # Tickets
        sample_tickets = [
            (2843, 1, 'Refund request for invoice #492', 'Customer requests refund for invoice 492. Please verify eligibility.', 'open'),
            (2841, 2, 'Unable to access account', 'User reports login failure with SSO. Error code 401.', 'open'),
            (3001, 3, 'Shipping delay - order #993', 'Package not delivered after estimated date.', 'ai_resolved'),
            (3002, 4, 'Incorrect charge on card', 'Customer reports unexpected billing line item.', 'pending_review'),
            (3003, 1, 'Feature request: export data', 'Customer asks for CSV export of reports.', 'closed'),
        ]

        for tid, cid, subject, body, status in sample_tickets:
            t = db.get(tables.Ticket, tid)
            if not t:
                # Provide initial AI draft and citations for a couple tickets so the UI shows content
                ai_draft = None
                ai_citations = None
                if tid == 2841:
                    ai_draft = "Hi there — I see you're having trouble logging in via SSO. Please try clearing your browser cookies and attempting login again. If the issue persists, ask your SSO admin to verify the OIDC client ID and ensure your account is provisioned."
                    ai_citations = [{'source': 'SSO Troubleshooting Guide', 'snippet': 'Clear cookies and verify OIDC client configuration', 'confidence': 0.92}]
                if tid == 2843:
                    ai_draft = "Thanks for reaching out — I can help with your refund request. I see invoice #492 is eligible for a full refund under our 30-day policy. I'll initiate the refund and notify you when it's processed."
                    ai_citations = [{'source': 'Billing Refund Policy v2.1', 'snippet': '30-day refund eligibility for invoices', 'confidence': 0.98}]

                t = tables.Ticket(id=tid, customer_id=cid, subject=subject, body=body, created_at=(datetime.utcnow() - timedelta(days=random.randint(0, 10))), status=status, ai_draft=ai_draft, ai_citations=json.dumps(ai_citations) if ai_citations else None)
                db.merge(t)
        db.commit()

        # Traces and TraceEvents
        traces = [
            (1, 2843, 'run-abc-1', '2026-05-25T12:40:00Z', None, 'Refund reasoning trace'),
            (2, 3002, 'run-xyz-2', '2026-05-24T09:12:00Z', '2026-05-24T09:12:02Z', 'Draft with citations'),
        ]
        for tidx, ticket_id, run_id, start, end, summary in traces:
            tr = db.get(tables.Trace, tidx)
            if not tr:
                tr = tables.Trace(id=tidx, ticket_id=ticket_id, run_id=run_id, start_time=datetime.utcnow(), end_time=None if end is None else datetime.utcnow(), summary=summary)
                db.merge(tr)
        db.commit()

        # Trace events
        events = [
            (1, 1, 'ingest', 'Received webhook and parsed ticket'),
            (2, 1, 'retrieve', 'Fetched 3 knowledge chunks'),
            (3, 1, 'draft', 'Generated response with 2 citations'),
            (4, 2, 'ingest', 'Ticket parsed'),
            (5, 2, 'draft', 'LLM produced initial draft'),
        ]
        for eid, trace_id, step, detail in events:
            ev = db.get(tables.TraceEvent, eid)
            if not ev:
                ev = tables.TraceEvent(id=eid, trace_id=trace_id, step=step, detail=detail)
                db.merge(ev)
        db.commit()

        # Reviews
        reviews = [
            (1, 3002, 'alice', 'reject', 'Needs more grounding', None),
            (2, 3001, 'bob', 'accept', 'Looks good', None),
        ]
        for rid, ticket_id, reviewer, decision, note, edited in reviews:
            r = db.get(tables.Review, rid)
            if not r:
                r = tables.Review(id=rid, ticket_id=ticket_id, reviewer=reviewer, decision=decision, note=note, edited_response=edited)
                db.merge(r)
        db.commit()

        # Evaluation runs
        evals = [
            (1, 2843, 'production', 'gpt-4o', 'v1', 0.98, 0.02, 0.9, 0.85, 120.5),
            (2, 3001, 'production', 'gpt-4o', 'v1', 0.87, 0.05, 0.78, 0.65, 240.1),
        ]
        for eid, ticket_id, dataset, model, prompt_v, groundedness, hallu, judge, retrieval_p, latency in evals:
            ev = db.get(tables.EvaluationRun, eid)
            if not ev:
                ev = tables.EvaluationRun(id=eid, ticket_id=ticket_id, dataset=dataset, model_version=model, prompt_version=prompt_v, groundedness=groundedness, hallucination_rate=hallu, judge_score=judge, retrieval_precision=retrieval_p, latency_ms=latency)
                db.merge(ev)
        db.commit()

        # Prompt versions
        prompts = [
            (1, 'Support Assistant', 'v1', 'Respond with concise grounded answers', 'system', 'deployed'),
            (2, 'Support Assistant', 'v2', 'Add citation lines for policies', 'alice', 'draft'),
        ]
        for pid, name, version, prompt_text, author, status in prompts:
            p = db.get(tables.PromptVersion, pid)
            if not p:
                p = tables.PromptVersion(id=pid, name=name, version=version, prompt=prompt_text, author=author, status=status)
                db.merge(p)
        db.commit()

        # Audit logs
        audits = [
            (1, 'system', 'seed', 'customers', 'created sample customers'),
            (2, 'system', 'seed', 'tickets', 'inserted sample tickets'),
        ]
        for aid, actor, action, entity, detail in audits:
            a = db.get(tables.AuditLog, aid)
            if not a:
                a = tables.AuditLog(id=aid, actor=actor, action=action, entity=entity, detail=detail)
                db.merge(a)
        db.commit()

        # App settings and leads
        s = db.query(tables.AppSetting).filter_by(key='site_name').first()
        if not s:
            db.merge(tables.AppSetting(id=1, key='site_name', value='Lumen Ops', updated_by='system'))
        db.merge(tables.Lead(id=1, name='Acme Interest', email='acme-lead@example.com', company='ACME Corp'))
        db.commit()

        print('Seed complete: customers, tickets, traces, reviews, evals, prompts, and audit logs inserted')
    finally:
        db.close()


if __name__ == '__main__':
    seed()
