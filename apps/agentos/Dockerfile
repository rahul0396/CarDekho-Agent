FROM python:3.12-slim

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy lockfile + manifest first for layer caching
COPY pyproject.toml uv.lock* ./

# Install runtime deps only (no dev). Compile bytecode for faster cold start.
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/usr/local
RUN uv sync --frozen --no-dev --no-install-project 2>/dev/null \
    || uv sync --no-dev --no-install-project

# Copy source
COPY . .

# Railway / Render / Fly inject PORT — fall back to 7777 for local docker run
ENV PORT=7777
EXPOSE 7777

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
