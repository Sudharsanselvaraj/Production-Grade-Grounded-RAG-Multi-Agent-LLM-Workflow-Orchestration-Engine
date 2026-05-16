"""Index help articles and tickets into Qdrant vector store.

Run: python scripts/index_qdrant.py
"""
from backend.retrieval.indexer import index_help_articles, index_tickets


def run():
    h = index_help_articles()
    t = index_tickets()
    print(f"Indexed {h} help article chunks and {t} ticket chunks into Qdrant")


if __name__ == "__main__":
    run()
