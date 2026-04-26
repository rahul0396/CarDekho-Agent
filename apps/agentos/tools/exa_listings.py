from agno.tools import Toolkit, tool
from exa_py import Exa
from config import settings


class ExaListingsToolkit(Toolkit):
    """Domain-locked Exa search for a specific car listing site."""

    def __init__(self, domain: str, source_label: str):
        super().__init__(name=f"exa_listings_{source_label}")
        self.domain = domain
        self.source_label = source_label
        self._exa = Exa(api_key=settings.exa_api_key)
        self.register(self.search_listings)

    def search_listings(self, query: str, used_only: bool = False) -> str:
        """
        Search for car listings on the target site.
        Returns a JSON-formatted list of listings for the agent to parse.
        """
        full_query = f"{query} car for sale" if not used_only else f"used {query} car for sale"
        try:
            results = self._exa.search_and_contents(
                full_query,
                include_domains=[self.domain],
                num_results=8,
                livecrawl="always",
                text={"max_characters": 2000},
            )
            listings = []
            for r in results.results:
                listings.append({
                    "title": r.title,
                    "url": r.url,
                    "content_snippet": (r.text or "")[:800],
                    "source": self.source_label,
                })
            import json
            return json.dumps(listings, ensure_ascii=False)
        except Exception as exc:
            return f"Search failed for {self.source_label}: {exc}"


cardekho_listings_toolkit = ExaListingsToolkit(
    domain="cardekho.com", source_label="cardekho"
)
cars24_listings_toolkit = ExaListingsToolkit(
    domain="cars24.com", source_label="cars24"
)
spinny_listings_toolkit = ExaListingsToolkit(
    domain="spinny.com", source_label="spinny"
)
