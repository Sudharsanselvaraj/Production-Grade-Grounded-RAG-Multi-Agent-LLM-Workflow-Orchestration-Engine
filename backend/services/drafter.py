import json
import time
from typing import Dict, Any, List
import config
from .ollama import OllamaClient
from ..retrieval.indexer import chunk_text
from ..retrieval.embeddings import EmbeddingClient
from ..retrieval.qdrant_client import get_qdrant_client
from ..repositories.ticket_repo import update_ticket_decision

settings = config.settings


def load_prompt(path: str = "backend/prompts/drafting/v1.md") -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def retrieve_context(subject: str, body: str, top_k: int = None) -> List[Dict[str, Any]]:
    emb = EmbeddingClient()
    client = get_qdrant_client()
    q = subject + "\n\n" + body
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


def validate_citations(citations: List[Dict[str, Any]], retrieved: List[Dict[str, Any]]) -> bool:
    # Ensure each citation matches one of the retrieved payloads by id/source
    retrieved_set = {(r.get("source"), str(r.get("id"))) for r in retrieved}
    for c in citations:
        if (c.get("source"), str(c.get("id"))) not in retrieved_set:
            return False
    return True


def generate_draft(db, ticket, prompt_path: str = "backend/prompts/drafting/v1.md") -> Dict[str, Any]:
    prompt = load_prompt(prompt_path)
    retrieved = retrieve_context(ticket.subject, ticket.body)
    # Build prompt including retrieved context with citations
    context_text = "\n\n".join([f"[{i}] {r['source']}:{r['id']} - {r['snippet']}" for i, r in enumerate(retrieved)])
    prompt_text = f"{prompt}\n\nCONTEXT:\n{context_text}\n\nTICKET SUBJECT:\n{ticket.subject}\n\nBODY:\n{ticket.body}\n\nReturn JSON: {json.dumps({'draft': '...', 'citations': []})}"

    client = OllamaClient()
    attempts = 0
    last_exc = None
    while attempts < 3:
        attempts += 1
        try:
            # tracing
            try:
                from ..observability.tracer import start_trace, log_event, finish_trace
                trace = start_trace(db, ticket_id=ticket.id)
                log_event(db, trace.id, "draft:start", {"model": settings.DRAFTER_MODEL})
            except Exception:
                trace = None
            resp = client.generate(model=settings.DRAFTER_MODEL, prompt=prompt_text, max_tokens=512)
            # extract text
            text = None
            if isinstance(resp, dict):
                text = resp.get("output") or (resp.get("choices") and resp["choices"][0].get("message"))
            if not text:
                raise RuntimeError("no model output")
            # parse JSON
            j = None
            try:
                j = json.loads(text)
            except Exception:
                # try to extract JSON substring
                import re
                m = re.search(r"\{.*\}", text, re.S)
                if m:
                    j = json.loads(m.group(0))
            if not j or 'draft' not in j:
                raise RuntimeError("model output missing draft")

            citations = j.get('citations', [])
            # Validate citations against retrieved context; if invalid, strip citations and mark for review
            if citations and not validate_citations(citations, retrieved):
                # strip unreliable citations and lower confidence
                j['citations'] = []
                j['note'] = 'citations_unverified'

            # persist draft and citations to ticket (as JSON string)
            ticket.ai_draft = j.get('draft')
            ticket.ai_citations = json.dumps(j.get('citations', []))
            # commit via DB session
            db.add(ticket)
            db.commit()
            db.refresh(ticket)
            if trace:
                log_event(db, trace.id, "draft:success", {"citations": j.get('citations', [])})
                finish_trace(db, trace, {"stage": "draft"})
            return {"draft": j.get('draft'), "citations": j.get('citations', []), "note": j.get('note', None)}
        except Exception as e:
            last_exc = e
            time.sleep(attempts * 0.5)
    raise RuntimeError(f"drafting failed: {last_exc}")
