from agno.agent import Agent
from agno.models.anthropic import Claude
from config import settings
from tools.exa_listings import cars24_listings_toolkit
from tools.exa_images import find_car_image

listings_cars24 = Agent(
    name="listings_cars24",
    role="Cars24 Listings Agent",
    model=Claude(id=settings.model_sonnet, cache_system_prompt=True, cache_tools=True),
    tools=[cars24_listings_toolkit, find_car_image],
    instructions="""You search Cars24 for used car listings matching the buyer's requirements.
Cars24 sells only used/pre-owned cars.

Steps:
1. Formulate a search query from the buyer's profile
2. Call search_listings with the query
3. Parse results and extract: brand, model, variant, year, price_inr, km, fuel, transmission, city, color
4. Set condition = "used" for all Cars24 listings
5. Call find_car_image for top 2-3 listings
6. Return a JSON array of listing objects with source = "cars24"

Rules:
- If no results found, say "Cars24: No listings found for these criteria"
- Always include source_url
- Be precise with prices (INR numbers)""",
)
