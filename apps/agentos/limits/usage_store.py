from datetime import datetime, timezone
from db.client import get_db
from limits.config import MODEL_PRICE_PER_1K_INPUT, MODEL_PRICE_PER_1K_OUTPUT


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _session_key(session_id: str) -> dict:
    return {"session_id": session_id, "date": _today()}


def get_session_usage(session_id: str) -> dict:
    db = get_db()
    doc = db.usage.find_one(_session_key(session_id))
    return doc or {
        "session_id": session_id,
        "date": _today(),
        "runs": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "cost_usd_estimate": 0.0,
    }


def get_global_usage() -> dict:
    db = get_db()
    doc = db.usage_global.find_one({"date": _today()})
    return doc or {"date": _today(), "runs": 0}


def increment_run(session_id: str) -> None:
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    db.usage.update_one(
        _session_key(session_id),
        {
            "$inc": {"runs": 1},
            "$set": {"last_run_at": now},
            "$setOnInsert": {
                "session_id": session_id,
                "date": _today(),
                "input_tokens": 0,
                "output_tokens": 0,
                "cost_usd_estimate": 0.0,
            },
        },
        upsert=True,
    )
    db.usage_global.update_one(
        {"date": _today()},
        {"$inc": {"runs": 1}},
        upsert=True,
    )


def record_tokens(session_id: str, input_tokens: int, output_tokens: int, model: str) -> None:
    cost = (
        input_tokens / 1000 * MODEL_PRICE_PER_1K_INPUT.get(model, 0.003)
        + output_tokens / 1000 * MODEL_PRICE_PER_1K_OUTPUT.get(model, 0.015)
    )
    db = get_db()
    db.usage.update_one(
        _session_key(session_id),
        {
            "$inc": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_usd_estimate": cost,
            }
        },
    )


# Sliding-window rate limit stored in memory (per-process; resets on restart — acceptable for v1)
import time
from collections import deque

_rate_windows: dict[str, deque] = {}


def check_rate_limit(session_id: str, limit_per_min: int) -> tuple[bool, int]:
    """Returns (allowed, retry_after_seconds)."""
    now = time.time()
    window = _rate_windows.setdefault(session_id, deque())
    # purge entries older than 60s
    while window and window[0] < now - 60:
        window.popleft()
    if len(window) >= limit_per_min:
        retry_after = int(60 - (now - window[0])) + 1
        return False, retry_after
    window.append(now)
    return True, 0
