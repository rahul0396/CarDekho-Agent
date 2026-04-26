from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from limits.usage_store import get_session_usage, get_global_usage
from limits import config as limit_cfg

router = APIRouter(prefix="/v1", tags=["usage"])


def _reset_at() -> str:
    now = datetime.now(timezone.utc)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.isoformat()


def _pct(used: int, limit: int) -> float:
    return round(min(used / limit * 100, 100), 1) if limit > 0 else 0.0


@router.get("/usage")
def get_usage(session_id: str = Query(..., description="Session ID")):
    session = get_session_usage(session_id)
    global_u = get_global_usage()

    runs_used = session.get("runs", 0)
    input_used = session.get("input_tokens", 0)
    output_used = session.get("output_tokens", 0)

    return {
        "session": {
            "used": {
                "runs": runs_used,
                "input_tokens": input_used,
                "output_tokens": output_used,
                "cost_usd_estimate": round(session.get("cost_usd_estimate", 0.0), 4),
            },
            "limits": {
                "runs": limit_cfg.DAILY_RUN_LIMIT,
                "input_tokens": limit_cfg.DAILY_INPUT_TOKEN_LIMIT,
                "output_tokens": limit_cfg.DAILY_OUTPUT_TOKEN_LIMIT,
            },
            "percent_used": {
                "runs": _pct(runs_used, limit_cfg.DAILY_RUN_LIMIT),
                "input_tokens": _pct(input_used, limit_cfg.DAILY_INPUT_TOKEN_LIMIT),
                "output_tokens": _pct(output_used, limit_cfg.DAILY_OUTPUT_TOKEN_LIMIT),
            },
            "reset_at": _reset_at(),
        },
        "global": {
            "runs": global_u.get("runs", 0),
            "limit": limit_cfg.GLOBAL_DAILY_RUN_BUDGET,
            "percent_used": _pct(global_u.get("runs", 0), limit_cfg.GLOBAL_DAILY_RUN_BUDGET),
        },
    }
