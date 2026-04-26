def lakh(amount: float) -> str:
    """Format an INR amount as ₹X.XX L or ₹X.XX Cr."""
    if amount >= 10_000_000:
        return f"₹{amount / 10_000_000:.2f} Cr"
    if amount >= 100_000:
        return f"₹{amount / 100_000:.2f} L"
    return f"₹{amount:,.0f}"
