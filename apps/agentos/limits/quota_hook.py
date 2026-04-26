from agno.exceptions import InputCheckError
from limits import config as limit_cfg
from limits.usage_store import (
    check_rate_limit,
    get_session_usage,
    get_global_usage,
    increment_run,
    record_tokens,
)


def before_run_hook(session_id: str, **kwargs) -> None:
    """Pre-hook: enforce rate limit, daily caps, and global circuit breaker."""
    # 1. Rate limit
    allowed, retry_after = check_rate_limit(session_id, limit_cfg.RATE_LIMIT_PER_MIN)
    if not allowed:
        raise InputCheckError(
            f'{{"type":"rate_limited","retry_after":{retry_after},"message":"Too many requests. Try again in {retry_after}s."}}'
        )

    # 2. Global circuit breaker
    global_usage = get_global_usage()
    if global_usage.get("runs", 0) >= limit_cfg.GLOBAL_DAILY_RUN_BUDGET:
        raise InputCheckError(
            '{"type":"service_busy","message":"Service is temporarily busy. Please try again later."}'
        )

    # 3. Session daily caps
    usage = get_session_usage(session_id)
    if usage.get("runs", 0) >= limit_cfg.DAILY_RUN_LIMIT:
        raise InputCheckError(
            f'{{"type":"quota_exceeded","kind":"runs","message":"Daily limit of {limit_cfg.DAILY_RUN_LIMIT} messages reached. Resets at midnight UTC."}}'
        )
    if usage.get("input_tokens", 0) >= limit_cfg.DAILY_INPUT_TOKEN_LIMIT:
        raise InputCheckError(
            '{"type":"quota_exceeded","kind":"input_tokens","message":"Daily input token limit reached. Resets at midnight UTC."}'
        )
    if usage.get("output_tokens", 0) >= limit_cfg.DAILY_OUTPUT_TOKEN_LIMIT:
        raise InputCheckError(
            '{"type":"quota_exceeded","kind":"output_tokens","message":"Daily output token limit reached. Resets at midnight UTC."}'
        )

    # 4. Increment run counter (pre-run so it's counted even if run fails)
    increment_run(session_id)


def after_run_hook(session_id: str, run=None, **kwargs) -> None:
    """Post-hook: record token usage from run metrics."""
    if run is None:
        return
    try:
        metrics = getattr(run, "metrics", None)
        if metrics is None:
            return
        input_tokens = getattr(metrics, "input_tokens", 0) or 0
        output_tokens = getattr(metrics, "output_tokens", 0) or 0
        model = getattr(run, "model", "claude-sonnet-4-6")
        if isinstance(model, str):
            model_id = model
        else:
            model_id = getattr(model, "id", "claude-sonnet-4-6")
        record_tokens(session_id, int(input_tokens), int(output_tokens), model_id)
    except Exception:
        pass
