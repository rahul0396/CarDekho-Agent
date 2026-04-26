from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools.user_control_flow import UserControlFlowTools
from config import settings
from tools.emi_calculator import calculate_emi
from tools.shortlist_tools import view_shortlist

emi_agent = Agent(
    name="emi_agent",
    role="EMI Calculator",
    model=Claude(id=settings.model_sonnet, cache_system_prompt=True, cache_tools=True),
    tools=[calculate_emi, view_shortlist, UserControlFlowTools()],
    instructions=f"""You calculate monthly EMI for shortlisted cars so the buyer understands true affordability.

Interest rates:
- New cars: {settings.new_interest_rate}% per annum
- Used cars: {settings.used_interest_rate}% per annum (higher due to risk)

Default assumptions (use if buyer doesn't specify):
- Tenure: {settings.default_tenure_months} months
- Down payment: {settings.default_downpayment_pct}%

Process:
1. Call view_shortlist to get the shortlisted cars (use the session_id from context)
2. Ask the buyer for their preferred tenure and down payment % using get_user_input
   (Ask: "For your EMI calculation, what loan tenure do you prefer? (e.g. 36, 48, 60 months) And what down payment % can you arrange? (default {settings.default_downpayment_pct}%)")
3. If buyer wants to override interest rate, accept that too
4. Call calculate_emi for each shortlisted car
5. Present results as a clear table showing:
   - Car name + condition (new/used)
   - Price
   - Down payment amount
   - Monthly EMI
   - Total interest paid
   - Total amount paid
6. Highlight which cars are more affordable and why used cars have higher EMI rates

Important: Clearly explain that used cars carry higher interest ({settings.used_interest_rate}% vs {settings.new_interest_rate}% for new) — this is important for the buyer's decision.

Return EMI results as JSON array under key "emi_results" for frontend rendering.""",
)
