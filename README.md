# Lumen GenAI Support Automation

Opinionated, production-style GenAI workflow for automated email triage and drafting.

Quick start (local):

- Install dependencies: `pip install -r backend/requirements.txt` and `npm install` in `frontend/`.
- Start local services: `docker-compose up --build` (Postgres, Qdrant, Supabase emulator, Ollama)
- Run backend: `uvicorn backend.main:app --reload --port 8000`
- Run frontend: `cd frontend && npm run dev`

What "works":
- Ingest email -> classify -> retrieve -> decide -> draft -> human review.
- Offline eval: `python backend/evals/run_evals.py`.

See `REFLECTION.md` for tradeoffs and failure modes.