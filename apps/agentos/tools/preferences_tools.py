"""
Buyer-profile preference tools.

Stores per-session preferences in a process-memory dict keyed by `session_id`.
This is durable across turns within a single backend process — independent of
whether the database-backed session_state is reachable. (When the DB is up, we
also write through to session_state so other parts of Agno can see it.)
"""
import json

from agno.run.base import RunContext
from agno.tools import tool

# Process-memory store: session_id -> {key: value}
_PROFILES: dict[str, dict[str, str]] = {}


def _get_profile(run_context: RunContext | None) -> dict[str, str]:
    if run_context is None:
        return {}
    return _PROFILES.setdefault(run_context.session_id, {})


@tool(name="set_preference", description="Save a buyer preference (e.g. body_style, budget_min, budget_max, fuel, transmission, condition)")
def set_preference(
    key: str,
    value: str,
    run_context: RunContext | None = None,
    session_state: dict | None = None,
) -> str:
    """Store a single buyer preference. Persists for the whole session."""
    profile = _get_profile(run_context)
    profile[key] = value
    if session_state is not None:
        existing = session_state.get("buyer_profile", {})
        if not isinstance(existing, dict):
            existing = {}
        existing[key] = value
        session_state["buyer_profile"] = existing
    return f"Saved: {key} = {value}. Current profile: {json.dumps(profile, ensure_ascii=False)}"


@tool(name="get_buyer_profile", description="Retrieve the buyer profile gathered so far")
def get_buyer_profile(
    run_context: RunContext | None = None,
    session_state: dict | None = None,
) -> str:
    """Return everything we know about the buyer as a JSON string."""
    profile = _get_profile(run_context)
    if session_state is not None:
        ss_profile = session_state.get("buyer_profile", {})
        if isinstance(ss_profile, dict):
            for k, v in ss_profile.items():
                profile.setdefault(k, str(v))
    return json.dumps(profile, ensure_ascii=False)


@tool(name="clear_buyer_profile", description="Reset the buyer profile (start over)")
def clear_buyer_profile(
    run_context: RunContext | None = None,
    session_state: dict | None = None,
) -> str:
    if run_context is not None:
        _PROFILES[run_context.session_id] = {}
    if session_state is not None:
        session_state["buyer_profile"] = {}
    return "Profile cleared"


def read_profile_for_session(session_id: str) -> dict[str, str]:
    """Helper for orchestrator/other tools to peek at the current profile."""
    return dict(_PROFILES.get(session_id, {}))
