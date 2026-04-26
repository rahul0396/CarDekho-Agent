"""Total Cost of Ownership estimators — heuristic tables, not live quotes."""
from agno.tools import tool
from tools.format_inr import lakh

BRAND_TIER: dict[str, str] = {
    "maruti": "mass", "suzuki": "mass", "hyundai": "mass", "tata": "mass",
    "kia": "mass", "mahindra": "mass", "honda": "mass", "toyota": "mass",
    "renault": "mass", "nissan": "mass", "volkswagen": "mass",
    "skoda": "premium", "jeep": "premium", "mg": "premium", "citroen": "premium",
    "bmw": "luxury", "mercedes": "luxury", "audi": "luxury", "volvo": "luxury",
    "land rover": "luxury", "lexus": "luxury",
}

ANNUAL_SERVICE_COST: dict[str, dict[int, int]] = {
    "mass":    {0: 8_000,  3: 12_000, 5: 18_000},
    "premium": {0: 15_000, 3: 22_000, 5: 30_000},
    "luxury":  {0: 35_000, 3: 55_000, 5: 80_000},
}

FUEL_PRICE_PER_LITRE: dict[str, float] = {
    "petrol": 103.0, "diesel": 89.0, "cng": 75.0,
    "ev": 3.0, "hybrid": 103.0,
}

DEPRECIATION_YEAR: list[float] = [0.85, 0.72, 0.62, 0.54, 0.47]


def _tier(brand: str) -> str:
    return BRAND_TIER.get(brand.lower(), "mass")


def _slab(table: dict[int, int], age: int) -> int:
    for threshold in sorted(table.keys(), reverse=True):
        if age >= threshold:
            return table[threshold]
    return list(table.values())[0]


# ── Pure implementations (used internally and by @tool wrappers) ─────────────

def _estimate_insurance(price_inr: float, age_years: int, city_tier: str = "metro") -> dict:
    base_rate = 0.03 if age_years == 0 else max(0.015, 0.03 - age_years * 0.003)
    multiplier = 1.1 if city_tier == "metro" else 1.0
    premium = price_inr * base_rate * multiplier
    return {"annual_premium_inr": round(premium), "display": lakh(premium)}


def _estimate_fuel_cost(mileage_kmpl: float, km_per_year: int, fuel_type: str) -> dict:
    price = FUEL_PRICE_PER_LITRE.get(fuel_type.lower(), 103.0)
    cost = km_per_year * price if fuel_type.lower() == "ev" else (km_per_year / mileage_kmpl) * price
    return {"annual_fuel_cost_inr": round(cost), "display": lakh(cost)}


def _estimate_service_cost(brand: str, age_years: int) -> dict:
    cost = _slab(ANNUAL_SERVICE_COST[_tier(brand)], age_years)
    return {"annual_service_cost_inr": cost, "display": lakh(cost)}


def _estimate_resale(price_inr: float, age_years: int) -> dict:
    idx_3 = min(age_years + 3, len(DEPRECIATION_YEAR)) - 1
    idx_5 = min(age_years + 5, len(DEPRECIATION_YEAR)) - 1
    r3 = price_inr * DEPRECIATION_YEAR[idx_3]
    r5 = price_inr * DEPRECIATION_YEAR[idx_5]
    return {
        "resale_3yr_inr": round(r3), "resale_5yr_inr": round(r5),
        "resale_3yr_display": lakh(r3), "resale_5yr_display": lakh(r5),
    }


def _five_year_tco(
    price_inr: float, brand: str, fuel_type: str, mileage_kmpl: float,
    km_per_year: int, age_years: int = 0, condition: str = "new", city_tier: str = "metro",
) -> dict:
    from config import settings
    resale = _estimate_resale(price_inr, age_years)
    depreciation = price_inr - resale["resale_5yr_inr"]
    fuel_annual = _estimate_fuel_cost(mileage_kmpl, km_per_year, fuel_type)["annual_fuel_cost_inr"]
    service_annual = _estimate_service_cost(brand, age_years)["annual_service_cost_inr"]
    insurance_annual = _estimate_insurance(price_inr, age_years, city_tier)["annual_premium_inr"]

    interest_rate = settings.new_interest_rate if condition == "new" else settings.used_interest_rate
    principal = price_inr * 0.8
    monthly_r = interest_rate / 100 / 12
    monthly_emi = principal * monthly_r * (1 + monthly_r) ** 60 / ((1 + monthly_r) ** 60 - 1)
    total_interest = monthly_emi * 60 - principal

    tco = depreciation + (fuel_annual * 5) + (service_annual * 5) + (insurance_annual * 5) + total_interest
    return {
        "five_year_tco_inr": round(tco), "display": lakh(tco),
        "breakdown": {
            "depreciation": lakh(depreciation), "fuel_5yr": lakh(fuel_annual * 5),
            "service_5yr": lakh(service_annual * 5), "insurance_5yr": lakh(insurance_annual * 5),
            "loan_interest": lakh(total_interest),
        },
    }


# ── Agno @tool wrappers (used by agents) ─────────────────────────────────────

@tool(name="estimate_insurance", description="Estimate annual car insurance premium")
def estimate_insurance(price_inr: float, age_years: int, city_tier: str = "metro") -> dict:
    return _estimate_insurance(price_inr, age_years, city_tier)


@tool(name="estimate_fuel_cost", description="Estimate annual fuel cost")
def estimate_fuel_cost(mileage_kmpl: float, km_per_year: int, fuel_type: str) -> dict:
    return _estimate_fuel_cost(mileage_kmpl, km_per_year, fuel_type)


@tool(name="estimate_service_cost", description="Estimate annual service and maintenance cost")
def estimate_service_cost(brand: str, age_years: int) -> dict:
    return _estimate_service_cost(brand, age_years)


@tool(name="estimate_resale", description="Estimate 3-year and 5-year resale value")
def estimate_resale(price_inr: float, age_years: int) -> dict:
    return _estimate_resale(price_inr, age_years)


@tool(name="five_year_tco", description="Calculate 5-year total cost of ownership")
def five_year_tco(
    price_inr: float, brand: str, fuel_type: str, mileage_kmpl: float,
    km_per_year: int, age_years: int = 0, condition: str = "new", city_tier: str = "metro",
) -> dict:
    return _five_year_tco(price_inr, brand, fuel_type, mileage_kmpl, km_per_year, age_years, condition, city_tier)
