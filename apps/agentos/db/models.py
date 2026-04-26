from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class Listing(BaseModel):
    brand: str
    model: str
    variant: str = ""
    year: int
    price_inr: float
    km: int = 0
    fuel: str = ""
    transmission: str = ""
    city: str = ""
    color: str = ""
    condition: Literal["new", "used"] = "used"
    image_url: str = ""
    source_url: str = ""
    source: Literal["cardekho", "cars24", "spinny"] = "cardekho"


class ShortlistEntry(BaseModel):
    listing: Listing
    notes: str = ""
    added_at: datetime = Field(default_factory=datetime.utcnow)


class ShortlistDoc(BaseModel):
    session_id: str
    entries: list[ShortlistEntry] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewExcerpt(BaseModel):
    source_url: str
    snippet: str
    sentiment: Literal["positive", "negative", "neutral"] = "neutral"


class ReviewSummary(BaseModel):
    brand: str
    model: str
    pros: list[str]
    cons: list[str]
    red_flags: list[str]
    excerpts: list[ReviewExcerpt]


class ComparisonRow(BaseModel):
    metric: str
    values: dict[str, str]
    winner: str = ""


class ComparisonTable(BaseModel):
    cars: list[str]
    rows: list[ComparisonRow]


class EMIResult(BaseModel):
    listing_label: str
    condition: Literal["new", "used"]
    price_inr: float
    down_payment_inr: float
    principal: float
    tenure_months: int
    interest_rate: float
    monthly_emi: float
    total_interest: float
    total_paid: float


class BuyerProfile(BaseModel):
    use_case: str = ""
    body_style: str = ""
    seating: str = ""
    fuel: str = ""
    transmission: str = ""
    budget_min: float = 0.0
    budget_max: float = 0.0
    condition: Literal["new", "used", "both"] = "both"
    color: str = ""
    km_per_year: int = 0
    max_odometer: int = 0
