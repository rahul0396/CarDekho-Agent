import json
from agno.tools import tool
from exa_py import Exa
from config import settings

_exa: Exa | None = None


def _get_exa() -> Exa:
    global _exa
    if _exa is None:
        _exa = Exa(api_key=settings.exa_api_key)
    return _exa


@tool(name="fetch_reviews", description="Fetch owner and expert reviews for a car model")
def fetch_reviews(brand: str, model: str, year: int = 0) -> str:
    """Search CarDekho reviews, Team-BHP, and CarToq for owner and expert opinions."""
    year_str = f" {year}" if year else ""
    query = f"{brand} {model}{year_str} owner review pros cons reliability"
    try:
        results = _get_exa().search_and_contents(
            query,
            include_domains=["cardekho.com", "team-bhp.com", "cartoq.com"],
            num_results=6,
            livecrawl="always",
            text={"max_characters": 1500},
        )
        reviews = [
            {
                "source_url": r.url,
                "title": r.title,
                "snippet": (r.text or "")[:600],
            }
            for r in results.results
        ]
        return json.dumps(reviews, ensure_ascii=False)
    except Exception as exc:
        return f"Review fetch failed: {exc}"


@tool(name="recent_news", description="Fetch recent news and recall information for a car")
def recent_news(brand: str, model: str) -> str:
    """Check for recalls, issues, or recent news about a car model."""
    query = f"{brand} {model} recall issue news 2024 2025"
    try:
        results = _get_exa().search_and_contents(
            query,
            num_results=4,
            livecrawl="always",
            text={"max_characters": 800},
        )
        items = [
            {"url": r.url, "title": r.title, "snippet": (r.text or "")[:400]}
            for r in results.results
        ]
        return json.dumps(items, ensure_ascii=False)
    except Exception as exc:
        return f"News fetch failed: {exc}"
