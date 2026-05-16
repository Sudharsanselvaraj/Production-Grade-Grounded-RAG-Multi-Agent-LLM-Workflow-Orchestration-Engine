import os
from types import SimpleNamespace

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance, PointStruct
except Exception:  # pragma: no cover - fallback for lightweight test environments
    class PointStruct:  # type: ignore[too-many-ancestors]
        def __init__(self, id, vector, payload):
            self.id = id
            self.vector = vector
            self.payload = payload

    class VectorParams:  # type: ignore[too-many-ancestors]
        def __init__(self, size, distance):
            self.size = size
            self.distance = distance

    class Distance:
        COSINE = "Cosine"

    class QdrantClient:  # type: ignore[too-many-ancestors]
        def __init__(self, *args, **kwargs):
            self._collections = []

        def get_collections(self):
            return SimpleNamespace(collections=[SimpleNamespace(name=name) for name in self._collections])

        def recreate_collection(self, collection_name: str, vectors_config):
            if collection_name not in self._collections:
                self._collections.append(collection_name)

        def upsert(self, collection_name: str, points: list):
            return {"status": "ok", "count": len(points)}

        def search(self, collection_name: str, query_vector, limit: int, with_payload: bool = True, with_score: bool = True):
            return []


def get_qdrant_client(url: str = None):
    url = url or os.getenv("QDRANT_URL", "http://localhost:6333")
    # qdrant-client uses host/port or url
    return QdrantClient(url=url)


def ensure_collection(client: QdrantClient, collection_name: str, vector_size: int):
    cols = client.get_collections().collections
    names = [c.name for c in cols]
    if collection_name not in names:
        client.recreate_collection(collection_name=collection_name, vectors_config={"size": vector_size, "distance": "Cos"})


def upsert_points(client: QdrantClient, collection_name: str, points: list):
    # points: list of PointStruct or dicts
    client.upsert(collection_name=collection_name, points=points)
