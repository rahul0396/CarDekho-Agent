/* ─── Domain types mirroring Python Pydantic models ────────────────────────
   All inbound payloads are validated via schemas.ts (zod) before reaching here.
   Never use `any` — unknown values are narrowed at the boundary.
─────────────────────────────────────────────────────────────────────────── */

export type CarCondition = "new" | "used";
export type CarSource = "cardekho" | "cars24" | "spinny";
export type SentimentType = "positive" | "negative" | "neutral";

export interface Listing {
  brand: string;
  model: string;
  variant: string;
  year: number;
  price_inr: number;
  km: number;
  fuel: string;
  transmission: string;
  city: string;
  color: string;
  condition: CarCondition;
  image_url: string;
  source_url: string;
  source: CarSource;
}

export interface ShortlistEntry {
  listing: Listing;
  notes: string;
  added_at: string;
}

export interface ShortlistResponse {
  session_id: string;
  entries: ShortlistEntry[];
}

export interface ReviewExcerpt {
  source_url: string;
  snippet: string;
  sentiment: SentimentType;
}

export interface ReviewSummary {
  brand: string;
  model: string;
  pros: string[];
  cons: string[];
  red_flags: string[];
  excerpts: ReviewExcerpt[];
}

export interface ComparisonRow {
  metric: string;
  values: Record<string, string>;
  winner: string;
}

export interface ComparisonTable {
  cars: string[];
  rows: ComparisonRow[];
}

export interface EMIResult {
  listing_label: string;
  condition: CarCondition;
  price_inr: number;
  down_payment_inr: number;
  principal: number;
  tenure_months: number;
  interest_rate: number;
  monthly_emi: number;
  total_interest: number;
  total_paid: number;
  monthly_emi_display: string;
  price_display: string;
  total_paid_display: string;
  total_interest_display: string;
}

export interface BuyerProfile {
  use_case?: string;
  body_style?: string;
  seating?: string;
  fuel?: string;
  transmission?: string;
  budget_min?: number;
  budget_max?: number;
  condition?: "new" | "used" | "both";
  color?: string;
  km_per_year?: number;
  max_odometer?: number;
}

/* ─── Usage types ──────────────────────────────────────────────────────────── */
export interface UsageMetrics {
  runs: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd_estimate: number;
}

export interface UsageLimits {
  runs: number;
  input_tokens: number;
  output_tokens: number;
}

export interface UsagePercent {
  runs: number;
  input_tokens: number;
  output_tokens: number;
}

export interface SessionUsage {
  used: UsageMetrics;
  limits: UsageLimits;
  percent_used: UsagePercent;
  reset_at: string;
}

export interface UsageResponse {
  session: SessionUsage;
  global: {
    runs: number;
    limit: number;
    percent_used: number;
  };
}

/* ─── SSE event union ─────────────────────────────────────────────────────── */
export type SSEEvent =
  | { type: "token"; text: string }
  | { type: "tool_call_started"; member: string; tool: string; args: Record<string, unknown> }
  | { type: "tool_call_finished"; member: string; tool: string; result: string }
  | { type: "user_input_required"; schema: Record<string, unknown>; run_id: string }
  | { type: "shortlist_updated"; entries: ShortlistEntry[] }
  | { type: "quota_exceeded"; kind: string; message: string }
  | { type: "rate_limited"; retry_after: number; message: string }
  | { type: "service_busy"; message: string }
  | { type: "run_completed" }
  | { type: "run_error"; message: string };

/* ─── Chat message ─────────────────────────────────────────────────────────── */
export type MessageRole = "user" | "assistant" | "system";

export interface RichPayload {
  type: "listings" | "shortlist" | "comparison_table" | "review_summary" | "emi_results";
  data: Listing[] | ShortlistEntry[] | ComparisonTable | ReviewSummary | EMIResult[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  rich_payload?: RichPayload;
  timestamp: number;
  streaming?: boolean;
}

/* ─── Tool call state ─────────────────────────────────────────────────────── */
export interface ActiveToolCall {
  id: string;
  member: string;
  tool: string;
  status: "running" | "done";
  result_snippet?: string;
}
