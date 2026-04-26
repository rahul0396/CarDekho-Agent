from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse

from config import CORS_ORIGINS_LIST
from agents.orchestrator import orchestrator
from limits.usage_route import router as usage_router
from db.client import get_db

from agno.os.app import AgentOS


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("CarDekho AgentOS starting...")
    get_db()  # warm mongo connection
    yield
    print("CarDekho AgentOS shutting down")


agno_app = AgentOS(
    name="CarDekho Agent",
    teams=[orchestrator],
    cors_allowed_origins=CORS_ORIGINS_LIST,
)

app: FastAPI = agno_app.get_app()
app.router.lifespan_context = lifespan

app.include_router(usage_router)


# Shortlist read endpoint (writes happen via shortlist_tools inside agents)
@app.get("/v1/shortlist")
def get_shortlist(session_id: str = Query(...)):
    db = get_db()
    doc = db.shortlists.find_one({"session_id": session_id})
    if not doc:
        return JSONResponse(content={"session_id": session_id, "entries": []})
    entries = doc.get("entries", [])
    return JSONResponse(content={"session_id": session_id, "entries": entries})


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
