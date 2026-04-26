import json
from agno.tools import tool
from tools.tco_tools import _estimate_insurance, _estimate_resale
from tools.format_inr import lakh


def _build_comparison_table(listings_json: str) -> str:
    """
    Given a JSON list of listing objects, compute a comparison table with
    price, mileage, fuel, TCO, resale, and insurance columns.
    """
    try:
        listings: list[dict] = json.loads(listings_json)
    except json.JSONDecodeError:
        return "Error: invalid JSON"

    if len(listings) < 2:
        return "Need at least 2 cars to compare"

    car_labels = [f"{l.get('brand','')} {l.get('model','')} ({l.get('year','')})" for l in listings]
    rows: list[dict] = []

    prices = [l.get("price_inr", 0) for l in listings]
    rows.append({
        "metric": "Price",
        "values": {car_labels[i]: lakh(prices[i]) for i in range(len(listings))},
        "winner": car_labels[prices.index(min(prices))],
    })

    for i, listing in enumerate(listings):
        ins = _estimate_insurance(
            price_inr=listing.get("price_inr", 0),
            age_years=max(0, 2026 - listing.get("year", 2026)),
        )
        listing["_insurance"] = ins["annual_premium_inr"]

    rows.append({
        "metric": "Est. Insurance (annual)",
        "values": {car_labels[i]: lakh(listings[i]["_insurance"]) for i in range(len(listings))},
        "winner": car_labels[min(range(len(listings)), key=lambda i: listings[i]["_insurance"])],
    })

    for i, listing in enumerate(listings):
        res = _estimate_resale(
            price_inr=listing.get("price_inr", 0),
            age_years=max(0, 2026 - listing.get("year", 2026)),
        )
        listing["_resale_3yr"] = res["resale_3yr_inr"]

    rows.append({
        "metric": "Est. Resale (3yr)",
        "values": {car_labels[i]: lakh(listings[i]["_resale_3yr"]) for i in range(len(listings))},
        "winner": car_labels[max(range(len(listings)), key=lambda i: listings[i]["_resale_3yr"])],
    })

    rows.append({
        "metric": "Condition",
        "values": {car_labels[i]: listings[i].get("condition", "").upper() for i in range(len(listings))},
        "winner": "",
    })
    rows.append({
        "metric": "KM Driven",
        "values": {car_labels[i]: f"{listings[i].get('km', 0):,} km" for i in range(len(listings))},
        "winner": car_labels[min(range(len(listings)), key=lambda i: listings[i].get("km", 0))],
    })
    rows.append({
        "metric": "Fuel",
        "values": {car_labels[i]: listings[i].get("fuel", "—") for i in range(len(listings))},
        "winner": "",
    })
    rows.append({
        "metric": "Transmission",
        "values": {car_labels[i]: listings[i].get("transmission", "—") for i in range(len(listings))},
        "winner": "",
    })

    table = {"cars": car_labels, "rows": rows}
    return json.dumps(table, ensure_ascii=False)


@tool(name="build_comparison_table", description="Build a structured comparison table for 2-3 cars")
def build_comparison_table(listings_json: str) -> str:
    """Given a JSON list of listing objects, compute a comparison table."""
    return _build_comparison_table(listings_json)
