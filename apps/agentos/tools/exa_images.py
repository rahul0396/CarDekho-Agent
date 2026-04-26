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


@tool(name="find_car_image", description="Find a representative image URL for a car model")
def find_car_image(brand: str, model: str, year: int = 0, color: str = "") -> str:
    """
    Returns a JSON object with image_url (best found) and fallback_url.
    Frontend should always have a fallback for when image is unavailable.
    """
    year_str = f" {year}" if year else ""
    color_str = f" {color}" if color else ""
    query = f"{brand} {model}{year_str}{color_str} car image"
    try:
        results = _get_exa().search_and_contents(
            query,
            include_domains=["cardekho.com", "carwale.com", "zigwheels.com"],
            num_results=3,
            livecrawl="always",
            text={"max_characters": 200},
        )
        image_url = ""
        for r in results.results:
            if r.url:
                image_url = r.url
                break
        return json.dumps({"image_url": image_url, "brand": brand, "model": model})
    except Exception as exc:
        return json.dumps({"image_url": "", "error": str(exc)})
