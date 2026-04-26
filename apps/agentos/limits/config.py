import os

DAILY_RUN_LIMIT: int = int(os.getenv("DAILY_RUN_LIMIT", "50"))
DAILY_INPUT_TOKEN_LIMIT: int = int(os.getenv("DAILY_INPUT_TOKEN_LIMIT", "500000"))
DAILY_OUTPUT_TOKEN_LIMIT: int = int(os.getenv("DAILY_OUTPUT_TOKEN_LIMIT", "100000"))
MAX_TOKENS_PER_RUN: int = int(os.getenv("MAX_TOKENS_PER_RUN", "50000"))
RATE_LIMIT_PER_MIN: int = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
GLOBAL_DAILY_RUN_BUDGET: int = int(os.getenv("GLOBAL_DAILY_RUN_BUDGET", "5000"))

MODEL_PRICE_PER_1K_INPUT: dict[str, float] = {
    "claude-opus-4-7": 0.015,
    "claude-sonnet-4-6": 0.003,
}
MODEL_PRICE_PER_1K_OUTPUT: dict[str, float] = {
    "claude-opus-4-7": 0.075,
    "claude-sonnet-4-6": 0.015,
}
