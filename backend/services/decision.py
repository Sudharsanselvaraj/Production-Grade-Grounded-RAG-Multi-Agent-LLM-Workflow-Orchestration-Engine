from typing import Dict, Any, List
import config
from .ollama import OllamaClient
from ..retrieval.embeddings import EmbeddingClient
from ..retrieval.qdrant_client import get_qdrant_client
from ..repositories.ticket_repo import update_ticket_decision

settings = config.settings


def retrieve_context_for_ticket(ticket_subject: str, ticket_body: str, top_k: int = None) -> List[Dict[str, Any]]:
    emb = EmbeddingClient()
    client = get_qdrant_client()
    q = ticket_subject + "\n\n" + ticket_body
    vec = emb.embed([q])[0]
    collection = "help_articles"
    top_k = top_k or settings.RETRIEVAL_TOP_K
    try:
        hits = client.search(collection_name=collection, query_vector=vec, limit=top_k, with_payload=True, with_score=True)
    except Exception:
        return []
    results = []
    for h in hits:
        payload = h.payload if hasattr(h, 'payload') else h["payload"]
        score = h.score if hasattr(h, 'score') else h.get("score")
        snippet = payload.get("title") if payload.get("title") else payload.get("chunk", "")
        results.append({"source": payload.get("source"), "id": payload.get("id"), "snippet": snippet, "score": score})
    return results


def deterministic_decision(classification: Dict[str, Any], retrieved: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Rule 1: spam detection
    try:
        spam_score = float(classification.get("spam_score", 0))
    except Exception:
        spam_score = 0.0
    if spam_score >= settings.SPAM_THRESHOLD:
        return {"action": "close_spam", "confidence": 0.99, "reason": "high spam score"}

    # Rule 2: legal/compliance flag escalates
    if classification.get("category") == "legal" or float(classification.get("escalation_risk", 0)) >= settings.ESCALATION_URGENCY_THRESHOLD:
        return {"action": "escalate", "confidence": max(0.8, float(classification.get("confidence", 0.8))), "reason": "escalation risk or legal category"}

    # Rule 3: urgent technical issues escalate
    if classification.get("urgency") in ("critical", "high") and classification.get("category") in ("technical", "outage"):
        return {"action": "escalate", "confidence": float(classification.get("confidence", 0.8)), "reason": "high urgency technical"}

    # Rule 4: if high classifier confidence and relevant help articles found, auto-reply
    if float(classification.get("confidence", 0)) >= settings.AUTO_REPLY_CONFIDENCE_THRESHOLD and len(retrieved) > 0:
        return {"action": "auto_reply", "confidence": float(classification.get("confidence", 0)), "reason": "high confidence and supporting context found"}

    # Rule 5: route deterministically by category
    category = classification.get("category", "general")
    routing_map = {
        "billing": "route_billing",
        "technical": "route_engineering",
        "sales": "route_sales",
        "legal": "escalate",
        "account": "route_account",
    }
    if category in routing_map:
        return {"action": routing_map[category], "confidence": float(classification.get("confidence", 0.5)), "reason": "category-based routing"}

    # Fallback to human review
    return {"action": "human_review", "confidence": float(classification.get("confidence", 0.4)), "reason": "no deterministic rule matched"}


def decide_and_persist(db, ticket, classification: Dict[str, Any]) -> Dict[str, Any]:
    # tracing
    try:
        from ..observability.tracer import start_trace, log_event, finish_trace
        trace = start_trace(db, ticket_id=ticket.id)
        log_event(db, trace.id, "decide:start", {"classification": classification})
    except Exception:
        trace = None

    # Retrieve context
    retrieved = retrieve_context_for_ticket(ticket.subject, ticket.body)
    # Apply deterministic rules
    decision = deterministic_decision(classification, retrieved)

    # If decision is human_review and classification confidence is low, optionally call LLM fallback
    if decision["action"] == "human_review":
        # Use LLM fallback for tie-breaking
        prompt = open("backend/prompts/routing/v1.md").read()
        prompt_text = f"{prompt}\n\nclassification: {classification}\n\nretrieved: {retrieved}\n\nReturn JSON." 
        client = OllamaClient()
        try:
            resp = client.generate(model=settings.ROUTER_MODEL, prompt=prompt_text, max_tokens=128)
            text = None
            if isinstance(resp, dict):
                text = resp.get("output") or (resp.get("choices") and resp["choices"][0].get("message"))
            if text:
                import json
                j = json.loads(text)
                # validate action
                if j.get("action") in ("auto_reply", "route", "escalate", "close_spam", "human_review"):
                    decision = j
        except Exception:
            pass

    # Persist decision to ticket
    update_ticket_decision(db, ticket, decision["action"], decision.get("confidence", 0.0))
    if trace:
        log_event(db, trace.id, "decide:result", {"decision": decision})
        finish_trace(db, trace, {"stage": "decide"})
    # return enriched decision including retrieved context for dashboard
    return {"decision": decision, "retrieved": retrieved}
