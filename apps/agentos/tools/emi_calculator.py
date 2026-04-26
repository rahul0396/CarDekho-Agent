from agno.tools import tool
from config import settings
from db.models import EMIResult
from tools.format_inr import lakh


def _calculate_emi(
    price_inr: float,
    down_payment_pct: float,
    tenure_months: int,
    condition: str,
    listing_label: str = "Car",
) -> dict:
    """
    Pure EMI calculation. condition: 'new' or 'used'.
    Uses standard amortization: EMI = P*r*(1+r)^n / ((1+r)^n - 1)
    """
    interest_rate = (
        settings.new_interest_rate if condition == "new" else settings.used_interest_rate
    )
    down_payment = price_inr * (down_payment_pct / 100)
    principal = price_inr - down_payment
    monthly_rate = interest_rate / 100 / 12

    if monthly_rate == 0:
        monthly_emi = principal / tenure_months
    else:
        monthly_emi = (
            principal
            * monthly_rate
            * (1 + monthly_rate) ** tenure_months
            / ((1 + monthly_rate) ** tenure_months - 1)
        )

    total_paid = monthly_emi * tenure_months
    total_interest = total_paid - principal

    result = EMIResult(
        listing_label=listing_label,
        condition=condition,  # type: ignore[arg-type]
        price_inr=price_inr,
        down_payment_inr=down_payment,
        principal=principal,
        tenure_months=tenure_months,
        interest_rate=interest_rate,
        monthly_emi=round(monthly_emi, 2),
        total_interest=round(total_interest, 2),
        total_paid=round(total_paid, 2),
    )
    return {
        **result.model_dump(),
        "monthly_emi_display": lakh(result.monthly_emi),
        "price_display": lakh(price_inr),
        "total_paid_display": lakh(result.total_paid),
        "total_interest_display": lakh(result.total_interest),
    }


@tool(name="calculate_emi", description="Calculate monthly EMI for a car loan")
def calculate_emi(
    price_inr: float,
    down_payment_pct: float,
    tenure_months: int,
    condition: str,
    listing_label: str = "Car",
) -> dict:
    """Calculate EMI using standard amortization formula. condition: 'new' or 'used'."""
    return _calculate_emi(price_inr, down_payment_pct, tenure_months, condition, listing_label)
