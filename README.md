# CarDekho-Agent-App

A conversational multi-agent system that walks an Indian car buyer from "I don't know what to buy" to "I'm confident about my shortlist."

## Architecture

- **Frontend** (`apps/web`) — Next.js 15 + TypeScript (strict) + Tailwind + shadcn/ui · Deployed on Vercel
- **Backend** (`apps/agentos`) — Python 3.12 + Agno + FastAPI (AgentOS) · Deployed on Railway
- **Database** — MongoDB (Atlas in prod, Docker locally)
- **LLM** — Claude Opus 4.7 (complex reasoning) + Sonnet 4.6 (routine tasks)
- **Live data** — Exa.ai (CarDekho, Cars24, Spinny listings + reviews)

## Agents

| Agent | Model | Role |
|---|---|---|
| Orchestrator | Opus 4.7 | Routes turns, fans out to sub-agents |
| preference_agent | Sonnet 4.6 | Interviews buyer, builds profile |
| listings_cardekho | Sonnet 4.6 | Live listings from cardekho.com |
| listings_cars24 | Sonnet 4.6 | Live listings from cars24.com |
| listings_spinny | Sonnet 4.6 | Live listings from spinny.com |
| qa_agent | Sonnet 4.6 | Answers buyer questions |
| comparison_agent | Opus 4.7 | Side-by-side car comparison + TCO |
| review_agent | Sonnet 4.6 | Owner + expert review summaries |
| shortlist_agent | Opus 4.7 | Ranks and persists shortlist |
| emi_agent | Sonnet 4.6 | EMI calculation (used vs new rates) |

## Quick Start (local)

```bash
# 1. Start MongoDB
docker compose up mongo -d

# 2. Start backend
cd apps/agentos
cp .env.example .env   # fill in ANTHROPIC_API_KEY, EXA_API_KEY
uv sync
uv run uvicorn main:app --reload

# 3. Start frontend (new terminal)
cd apps/web
pnpm install
pnpm dev
```

Open http://localhost:3000

## Environment Variables

### Backend (`apps/agentos/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
EXA_API_KEY=exa-...
MONGODB_URL=mongodb://localhost:27017
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_AGENTOS_URL=http://localhost:8000
```
