"""
Lumen Support AI — Main Application
FastAPI entry point. Sets up middleware, routes, startup/shutdown.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog

from backend.config import settings
from backend.database import create_tables
from backend.api.routes import tickets, auth

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("startup", env=settings.ENVIRONMENT, version=settings.APP_VERSION)

    # Create DB tables on startup (dev convenience; prod should use Alembic migrations)
    await create_tables()

    # Pre-warm embedding model (avoid cold start on first request)
    try:
        from backend.retrieval.retrieval_service import get_retrieval_service
        svc = get_retrieval_service()
        svc._get_embedding_model()
        logger.info("embedding_model_warmed")
    except Exception as e:
        logger.warning("embedding_warmup_failed", error=str(e))

    yield

    # Shutdown
    logger.info("shutdown")
    try:
        from backend.services.ollama_service import get_ollama_service
        await get_ollama_service().close()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,  # No Swagger in prod
    redoc_url=None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(tickets.router)


@app.get("/health")
async def health():
    """Health check. Used by Docker and load balancers."""
    from backend.services.ollama_service import get_ollama_service
    ollama_ok = await get_ollama_service().health_check()
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "ollama": "reachable" if ollama_ok else "unreachable",
    }


@app.get("/api/models")
async def list_models():
    """List available Ollama models."""
    from backend.services.ollama_service import get_ollama_service
    try:
        models = await get_ollama_service().list_models()
        return {"models": models}
    except Exception as e:
        return {"models": [], "error": str(e)}
