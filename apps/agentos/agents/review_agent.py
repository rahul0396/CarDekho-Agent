from agno.agent import Agent
from agno.models.anthropic import Claude
from config import settings
from tools.exa_reviews import fetch_reviews, recent_news

review_agent = Agent(
    name="review_agent",
    role="Car Review Analyst",
    model=Claude(id=settings.model_sonnet, cache_system_prompt=True, cache_tools=True),
    tools=[fetch_reviews, recent_news],
    instructions="""You aggregate owner reviews and expert opinions for specific car models.

When given a brand and model:
1. Call fetch_reviews to get owner and expert opinions
2. Call recent_news to check for recalls or known issues
3. Synthesise into a structured ReviewSummary:
   - pros: list of 3-5 genuine positives from reviews
   - cons: list of 3-5 genuine negatives
   - red_flags: any recalls, widespread complaints, or safety issues
   - excerpts: 2-3 direct quotes from reviews (with source URLs)

Return your analysis as a JSON object with keys: brand, model, pros, cons, red_flags, excerpts.
Each excerpt should have: source_url, snippet (exact quote or close paraphrase), sentiment.

Be honest — don't sugarcoat problems. If a car has known issues, say so clearly.""",
)
