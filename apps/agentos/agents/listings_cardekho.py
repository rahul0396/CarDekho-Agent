from agno.agent import Agent
from agno.models.anthropic import Claude
from config import settings
from tools.exa_listings import cardekho_listings_toolkit
from tools.exa_images import find_car_image

listings_cardekho = Agent(
    name="listings_cardekho",
    role="CarDekho Listings Agent",
    model=Claude(id=settings.model_sonnet, cache_system_prompt=True, cache_tools=True),
    tools=[cardekho_listings_toolkit, find_car_image],
    instructions="""You search CarDekho for car listings matching the buyer's requirements.

Steps:
1. Formulate a search query from the buyer's profile (brand/type, budget, fuel, city if known)
2. Call search_listings with the query
3. Parse the results and extract for each listing:
   - brand, model, variant, year, price_inr, km, fuel, transmission, city, color, condition
   - source_url (from the result URL)
4. Call find_car_image for the top 2-3 listings to get image_url
5. Return a JSON array of listing objects

Rules:
- If no results found, say "CarDekho: No listings found for these criteria"
- Always include source_url so buyers can verify
- Prices should be in INR (numbers, not strings)
- condition should be "used" for CarDekho used cars, "new" for new
- Keep your response focused on the structured data""",
)
