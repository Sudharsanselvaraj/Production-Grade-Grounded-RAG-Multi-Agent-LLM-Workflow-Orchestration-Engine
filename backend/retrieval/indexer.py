from typing import List
from ..db import SessionLocal
from ..models.tables import HelpArticle, Ticket
from .embeddings import EmbeddingClient
from .qdrant_client import get_qdrant_client, ensure_collection, upsert_points, PointStruct
import math


def chunk_text(text: str, max_chars: int = 800) -> List[str]:
    # Simple paragraph-based chunking with max_chars threshold
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    for p in paras:
        if len(p) <= max_chars:
            chunks.append(p)
        else:
            # break into slices
            for i in range(0, len(p), max_chars):
                chunks.append(p[i:i+max_chars])
    return chunks


def index_help_articles(collection: str = "help_articles", model_name: str = "all-MiniLM-L6-v2"):
    db = SessionLocal()
    client = get_qdrant_client()
    emb = EmbeddingClient(model_name=model_name)
    articles = db.query(HelpArticle).all()
    all_texts = []
    metadata = []
    for a in articles:
        chks = chunk_text(a.content)
        for i, c in enumerate(chks):
            all_texts.append(c)
            metadata.append({"source": "help_article", "id": a.id, "title": a.title, "chunk_index": i})

    if not all_texts:
        return 0

    vectors = emb.embed(all_texts)
    ensure_collection(client, collection, vector_size=len(vectors[0]))
    points = []
    for idx, v in enumerate(vectors):
        points.append(PointStruct(id=str(metadata[idx]["id"]) + f"-{metadata[idx]['chunk_index']}", vector=v, payload=metadata[idx]))
    upsert_points(client, collection, points)
    return len(points)


def index_tickets(collection: str = "past_tickets", model_name: str = "all-MiniLM-L6-v2"):
    db = SessionLocal()
    client = get_qdrant_client()
    emb = EmbeddingClient(model_name=model_name)
    tickets = db.query(Ticket).all()
    all_texts = []
    metadata = []
    for t in tickets:
        text = t.subject + "\n\n" + t.body
        chks = chunk_text(text)
        for i, c in enumerate(chks):
            all_texts.append(c)
            metadata.append({"source": "ticket", "id": t.id, "customer_id": t.customer_id, "chunk_index": i})

    if not all_texts:
        return 0

    vectors = emb.embed(all_texts)
    ensure_collection(client, collection, vector_size=len(vectors[0]))
    points = []
    for idx, v in enumerate(vectors):
        points.append(PointStruct(id=str(metadata[idx]["id"]) + f"-t{metadata[idx]['chunk_index']}", vector=v, payload=metadata[idx]))
    upsert_points(client, collection, points)
    return len(points)
