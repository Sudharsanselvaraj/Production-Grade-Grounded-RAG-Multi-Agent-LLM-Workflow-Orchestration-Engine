from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..retrieval.qdrant_client import get_qdrant_client
from ..retrieval.embeddings import EmbeddingClient

router = APIRouter()


class SearchIn(BaseModel):
    query: str
    top_k: int = 5
    collection: str = "help_articles"
    min_score: float = 0.0


@router.post("/search")
def api_search(req: SearchIn):
    client = get_qdrant_client()
    emb = EmbeddingClient()
    try:
        qvec = emb.embed([req.query])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"embedding failure: {e}")
    try:
        raw = client.search(collection_name=req.collection, query_vector=qvec, limit=req.top_k, with_payload=True, with_score=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    results = []
    for hit in raw:
        payload = hit.payload if hasattr(hit, "payload") else hit.get("payload", {})
        score = float(hit.score) if hasattr(hit, "score") else float(hit.get("score", 0.0))
        if score < req.min_score:
            continue
        results.append(
            {
                "id": payload.get("id"),
                "source": payload.get("source"),
                "document": payload.get("title") or payload.get("document") or payload.get("source"),
                "chunk": payload.get("chunk") or payload.get("content") or "",
                "page": payload.get("page"),
                "date": payload.get("date"),
                "score": score,
                "embedding_model": payload.get("embedding_model"),
            }
        )

    return {"results": results, "total": len(results)}
