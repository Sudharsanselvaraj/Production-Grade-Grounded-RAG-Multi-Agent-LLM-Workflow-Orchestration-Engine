from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.ingest import router as ingest_router
from .api.tickets import router as tickets_router
from .db import init_db
from .api.retrieval import router as retrieval_router
from .api.observability import router as observability_router
from .api.auth import router as auth_router

app = FastAPI(title="Lumen GenAI Support Automation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")
app.include_router(retrieval_router, prefix="/api/retrieval")
app.include_router(observability_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    # ensure DB tables exist on startup
    try:
        init_db()
    except Exception:
        pass


@app.get("/health")
async def health():
    return {"status": "ok"}
