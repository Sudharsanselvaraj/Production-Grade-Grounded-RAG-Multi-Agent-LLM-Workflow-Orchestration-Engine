from typing import List
import hashlib
import math

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - fallback for lightweight test environments
    SentenceTransformer = None

import numpy as np
import config

settings = config.settings


class EmbeddingClient:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name) if SentenceTransformer is not None else None

    def embed(self, texts: List[str]) -> List[List[float]]:
        if self.model is not None:
            arr = self.model.encode(texts, show_progress_bar=False)
            if isinstance(arr, np.ndarray):
                return arr.tolist()
            return [a.tolist() for a in arr]

        # Fallback: deterministic hash-based embeddings so tests can run without
        # the heavy sentence-transformers dependency.
        vectors: List[List[float]] = []
        dim = int(getattr(settings, "EMBEDDING_DIM", 32))
        for text in texts:
            vec = [0.0] * dim
            tokens = text.lower().split()
            for token in tokens:
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                for i in range(min(8, dim)):
                    vec[(digest[i] + i) % dim] += (digest[i] / 255.0)
            norm = math.sqrt(sum(value * value for value in vec)) or 1.0
            vectors.append([value / norm for value in vec])
        return vectors
