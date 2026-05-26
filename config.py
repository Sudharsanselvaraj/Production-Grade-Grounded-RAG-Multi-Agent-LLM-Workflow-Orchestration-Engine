"""
Lumen Support AI — Configuration
Central settings loaded from environment. No secrets in code.
"""
from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "Lumen Support AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8 hours — reasonable for a work shift

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lumen:lumen@localhost:5432/lumen_support"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Ollama (local LLM runtime)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_TIMEOUT: int = 120  # seconds
    # Model assignments — each model chosen for a specific task
    # phi3-mini: fast, good at structured JSON classification (3.8B, fits in ~4GB VRAM)
    CLASSIFIER_MODEL: str = "phi3:mini"
    # llama3:8b: best open-source 8B chat model, strong instruction following for drafting
    DRAFTER_MODEL: str = "llama3:8b"
    # mistral:7b-instruct: good at routing/decision reasoning
    ROUTER_MODEL: str = "mistral:7b-instruct"
    # Used only for genuinely hard escalation cases — heavier, slower
    STRONG_MODEL: str = "llama3:8b"

    # ChromaDB (vector store — simpler than Qdrant for local dev, no extra service)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_PERSIST_DIR: str = "./data/chroma"

    # Embeddings — bge-small-en-v1.5: best-in-class for size (33M params, 384 dim)
    # Chosen over larger models because retrieval quality is nearly identical at <512 tokens
    # and latency is ~10x lower. MTEB retrieval score: 51.7 vs MiniLM's 48.1
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384

    # RAG Configuration
    # Chunk size 512 chosen after testing: captures full policy paragraphs without
    # exceeding embedding model's sweet spot. Overlap 64 preserves cross-chunk context.
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    RETRIEVAL_TOP_K: int = 5
    RETRIEVAL_RERANK_TOP_K: int = 3

    # Guardrails
    PII_DETECTION_ENABLED: bool = True
    PROMPT_INJECTION_DETECTION_ENABLED: bool = True
    MAX_EMAIL_BODY_CHARS: int = 10_000

    # Notion integration (help center)
    NOTION_API_KEY: str = ""
    NOTION_DATABASE_ID: str = ""

    # Supabase (customer DB)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Redis (task queue for async workflow)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Observability
    LOG_LEVEL: str = "INFO"
    TRACE_RETENTION_DAYS: int = 30

    # Workflow thresholds — these are tunable without code changes
    AUTO_REPLY_CONFIDENCE_THRESHOLD: float = 0.82
    ESCALATION_URGENCY_THRESHOLD: float = 0.75
    SPAM_THRESHOLD: float = 0.90
    LEGAL_FLAG_THRESHOLD: float = 0.70

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
