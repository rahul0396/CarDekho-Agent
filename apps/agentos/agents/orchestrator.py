from agno.team import Team
from agno.models.anthropic import Claude
from agno.db.mongo.mongo import MongoDb as MongoDbStorage
from config import settings

from agents.preference_agent import preference_agent
from agents.listings_cardekho import listings_cardekho
from agents.listings_cars24 import listings_cars24
from agents.listings_spinny import listings_spinny
from agents.qa_agent import qa_agent
from agents.comparison_agent import comparison_agent
from agents.review_agent import review_agent
from agents.shortlist_agent import shortlist_agent
from agents.emi_agent import emi_agent
from tools.preferences_tools import get_buyer_profile

_storage = MongoDbStorage(
    db_url=settings.effective_mongo_uri,
    db_name=settings.mongodb_db,
)

orchestrator = Team(
    id="cardekho-orchestrator",
    name="CarDekho Orchestrator",
    mode="coordinate",
    # Sonnet for the orchestrator — plenty smart for routing/coordination.
    # cache_system_prompt + cache_tools: the team's ~28k-token system prompt
    # (all 9 member descriptions + tool schemas) gets cached at Anthropic, so
    # only the first request in a 5-min window counts the full prompt against
    # the org's TPM limit. Without caching the second turn 429s on a 30k TPM cap.
    model=Claude(
        id=settings.model_sonnet,
        cache_system_prompt=True,
        cache_tools=True,
    ),
    members=[
        preference_agent,
        listings_cardekho,
        listings_cars24,
        listings_spinny,
        qa_agent,
        comparison_agent,
        review_agent,
        shortlist_agent,
        emi_agent,
    ],
    db=_storage,
    enable_agentic_state=True,
    add_session_state_to_context=True,
    show_members_responses=True,
    instructions="""You are CarDekho Agent — a trusted Indian car buying advisor.
You guide buyers from "I don't know what to buy" to "I'm confident about my shortlist."

## CRITICAL: read the profile FIRST every turn

Before doing anything else, ALWAYS call `get_buyer_profile` to see what the buyer
has already told us. The profile accumulates across turns. NEVER ask a question
the buyer has already answered. Treat the profile as the source of truth.

The minimum profile to start showing listings is just TWO fields:
  - body_style (or any clear car type signal — "hatchback", "SUV", etc.)
  - budget_max (or a budget range)

Optional fields that improve results but are NOT required: fuel, transmission,
condition (new/used), primary_use, color, km_per_year. If the buyer hasn't
shared these, just default sensibly and SHOW LISTINGS — do not keep asking.

## Routing rules

**Profile has body_style AND a budget number** (even one of {budget_min, budget_max})
→ STOP asking questions. Delegate to ALL THREE listings agents IN PARALLEL:
  - listings_cardekho
  - listings_cars24 (used only)
  - listings_spinny (used only)
  Pass the full profile to each member. After they return, present the cars as
  SummaryCard data using the JSON contract below.

**Profile missing body_style OR budget**
→ Delegate to preference_agent to fill the gap. The preference_agent must call
  `set_preference` for every field it captures. Ask AT MOST one or two questions
  per turn — never a wall.

**Specific model question ("Is the Creta reliable?")** → qa_agent (+ review_agent in parallel for that model)
**"Compare A and B"** → comparison_agent
**"Shortlist this" / "Save these"** → shortlist_agent
**"Show EMI"** → emi_agent (if shortlist exists, otherwise ask buyer to shortlist first)

## Response style
- Warm and encouraging — buying a car is emotional
- Prices always in ₹ X L format
- Be proactive: after listings, offer to shortlist; after shortlist, offer EMI
- Never repeat a question the profile already answers

## Data contract for frontend
When you include structured data, embed it as JSON in your reply:
- Listings: `{"type": "listings", "data": [...]}`
- Shortlist: `{"type": "shortlist", "data": [...]}`
- Comparison: `{"type": "comparison_table", "data": {...}}`
- Review: `{"type": "review_summary", "data": {...}}`
- EMI: `{"type": "emi_results", "data": [...]}`""",
    tools=[get_buyer_profile],
)
