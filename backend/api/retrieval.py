from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..retrieval.qdrant_client import get_qdrant_client
from ..retrieval.embeddings import EmbeddingClient

router = APIRouter()


class SearchIn(BaseModel):
    query: str
    top_k: int = 5
    collection: str = "help_articles"


@router.post("/search")
def api_search(req: SearchIn):
    client = get_qdrant_client()
    emb = EmbeddingClient()
    try:
        qvec = emb.embed([req.query])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"embedding failure: {e}")
    try:
        res = client.search(collection_name=req.collection, query_vector=qvec, limit=req.top_k, with_payload=True, with_score=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"results": res}
