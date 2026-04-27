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

## Live Demo

- **Frontend:** https://cardekho-agent-app.vercel.app
- **Backend API:** https://cardekho-agentos-production.up.railway.app

## Future Roadmap — If We Had More Time

This is a working MVP built end-to-end. Here's what we'd build next, ordered by impact.

---

### 1. User Authentication & Persistent Profiles
Right now, everything is tied to an anonymous `session_id` cookie that disappears when the browser is cleared. With auth:
- Users could log in (Google / phone OTP) and have their buyer profile, shortlist, and chat history persist across devices and sessions.
- Dealers could get a separate login to list inventory directly.
- Usage quotas would be per-account rather than per-session, enabling fair metering without being overly restrictive for returning users.

### 2. Real-Time Pricing via Official APIs
Currently we use Exa.ai to crawl listings pages — which works but has latency and occasional noise in price/km extraction. With dedicated integrations:
- **CarDekho Partner API / Cars24 API** — structured, fresh inventory data with exact prices, odometer readings, inspection status, and dealer contact info.
- **OLX Autos, Droom, CarTrade** as additional listing sources for broader coverage.
- Price-drop alerts: if a shortlisted car drops in price, push a notification to the user.

### 3. Vehicle History & Inspection Reports
- Integrate **vahan.parivahan.gov.in** (Government RC lookup) to verify registration, ownership count, and tax paid for any used car.
- Partner with inspection services (CarDekho Assured, Cars24 Certified) to surface an inspection badge on listing cards.
- Flag odometer rollback risk based on service records vs km reported.

### 4. Dealer Contact & Test Drive Booking
- After shortlisting, let users book a test drive or contact the seller directly from the app — without leaving the chat.
- Track which test drives were booked; follow up post-visit with a "how did it go?" prompt that feeds back into the comparison agent.

### 5. Insurance Quotes
- Integrate **Policybazaar / Coverfox API** to pull live third-party + comprehensive insurance quotes for any shortlisted car, parameterized by city, car age, and variant.
- Surface the first-year insurance cost directly on the SummaryCard so the buyer sees the true on-road cost, not just the sticker price.

### 6. WhatsApp & Voice Interface
- Expose the orchestrator over **WhatsApp Business API** — the vast majority of Indian car buyers are more comfortable on WhatsApp than a web app.
- Add **voice input** (Web Speech API or Whisper) so buyers can describe what they want verbally. Especially useful on mobile during a commute.
- Add Hindi and other regional language support (the LLM already understands Hinglish; we just need to handle Devanagari rendering and prompt it to respond in the buyer's language).

### 7. Production-Grade Test Suite
The current codebase has zero automated tests — acceptable for a rapid MVP but not for production.
- **Unit tests** for `emi_calculator.py`, `tco_tools.py`, and all Exa parsing logic (pytest + snapshot tests).
- **Integration tests** that run the full orchestrator against a mocked Anthropic client to verify routing rules (does a "compare X vs Y" message correctly delegate to `comparison_agent`?).
- **End-to-end tests** with Playwright against the Next.js frontend (does the shortlist drawer populate after a shortlist command?).
- **CI/CD pipeline** (GitHub Actions): type-check, lint, test, build — required to pass before any merge to `main`.

### 8. Smarter Usage Limits & Billing
- Replace the current in-memory rate limiter with **Redis** (distributed, survives restarts, works across multiple Railway replicas).
- Add a **Stripe integration** so power users can buy additional daily quota — turning the usage cap from a hard wall into a soft nudge.
- Track per-model costs more accurately using Anthropic's usage API rather than estimating from a static price table.

### 9. Comparison & TCO Improvements
- Pull **NCAP safety ratings** from a structured database (not LLM extraction) for accurate star ratings in the comparison table.
- **Live fuel prices** from the IOCL / BPCL price feed by city — so the "annual fuel cost" row in TCO uses today's actual petrol/diesel price rather than a hardcoded default.
- **Finance offers**: pull current festive-season EMI schemes from manufacturer websites (e.g., Hyundai's 0% down, 6-month EMI-free offers) so the EMI agent can surface the best financing deal, not just the standard bank rate.

### 10. PDF Export & Shareable Shortlist
- Let users export their shortlist as a well-formatted PDF — useful when physically visiting a dealership or sharing with a spouse / parent before deciding.
- Generate a shareable link (`/s/{token}`) so the buyer can send their shortlist to someone else without them having to redo the conversation.

### 11. Analytics & Business Intelligence
- Track which cars are most frequently shortlisted, which sources produce the best conversion-to-shortlist rates, and which questions the QA agent fails to answer confidently — all useful for product iteration.
- A/B test orchestrator routing strategies (e.g., does asking one extra preference question before showing listings improve shortlist quality?).

### 12. Mobile App
- Package the Next.js frontend as a **PWA** (add a web manifest + service worker) for installable, offline-capable mobile use — zero app-store approval required.
- Longer term: a React Native app that reuses the same AgentOS backend, with native push notifications for price drops and test-drive reminders.
