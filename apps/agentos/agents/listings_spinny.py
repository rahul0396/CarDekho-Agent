from agno.agent import Agent
from agno.models.anthropic import Claude
from config import settings
from tools.exa_listings import spinny_listings_toolkit
from tools.exa_images import find_car_image

listings_spinny = Agent(
    name="listings_spinny",
    role="Spinny Listings Agent",
    model=Claude(id=settings.model_sonnet, cache_system_prompt=True, cache_tools=True),
    tools=[spinny_listings_toolkit, find_car_image],
    instructions="""You search Spinny for certified used car listings matching the buyer's requirements.
Spinny sells only certified pre-owned cars.

Steps:
1. Formulate a search query from the buyer's profile
2. Call search_listings with the query
3. Parse results and extract: brand, model, variant, year, price_inr, km, fuel, transmission, city, color
4. Set condition = "used" for all Spinny listings
5. Note: Spinny cars are certified pre-owned — mention this in your summary
6. Call find_car_image for top 2-3 listings
7. Return a JSON array of listing objects with source = "spinny"

Rules:
- If no results found, say "Spinny: No listings found for these criteria"
- Always include source_url""",
)
