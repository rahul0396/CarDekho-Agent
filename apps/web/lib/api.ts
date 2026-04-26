import { z } from "zod";
import type { ShortlistResponse, UsageResponse } from "./types";

// Always route through the Next.js API layer so the server-side AGENTOS_URL is
// used — avoids CORS issues and lets the browser ignore backend port changes.
const BASE_URL = "";

/* ─── Shortlist ─────────────────────────────────────────────────────────────── */
const ShortlistEntrySchema = z.object({
  listing: z.object({
    brand: z.string(),
    model: z.string(),
    variant: z.string().default(""),
    year: z.number(),
    price_inr: z.number(),
    km: z.number().default(0),
    fuel: z.string().default(""),
    transmission: z.string().default(""),
    city: z.string().default(""),
    color: z.string().default(""),
    condition: z.enum(["new", "used"]).default("used"),
    image_url: z.string().default(""),
    source_url: z.string().default(""),
    source: z.enum(["cardekho", "cars24", "spinny"]).default("cardekho"),
  }),
  notes: z.string().default(""),
  added_at: z.string(),
});

const ShortlistResponseSchema = z.object({
  session_id: z.string(),
  entries: z.array(ShortlistEntrySchema),
});

export async function fetchShortlist(sessionId: string): Promise<ShortlistResponse> {
  try {
    const res = await fetch(`${BASE_URL}/api/shortlist?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return { session_id: sessionId, entries: [] };
    const raw: unknown = await res.json();
    const parsed = ShortlistResponseSchema.safeParse(raw);
    if (!parsed.success) return { session_id: sessionId, entries: [] };
    return parsed.data;
  } catch {
    return { session_id: sessionId, entries: [] };
  }
}

/* ─── Usage ─────────────────────────────────────────────────────────────────── */
const UsageResponseSchema = z.object({
  session: z.object({
    used: z.object({
      runs: z.number(),
      input_tokens: z.number(),
      output_tokens: z.number(),
      cost_usd_estimate: z.number(),
    }),
    limits: z.object({
      runs: z.number(),
      input_tokens: z.number(),
      output_tokens: z.number(),
    }),
    percent_used: z.object({
      runs: z.number(),
      input_tokens: z.number(),
      output_tokens: z.number(),
    }),
    reset_at: z.string(),
  }),
  global: z.object({
    runs: z.number(),
    limit: z.number(),
    percent_used: z.number(),
  }),
});

export async function fetchUsage(sessionId: string): Promise<UsageResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/usage?session_id=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return null;
    const raw: unknown = await res.json();
    const parsed = UsageResponseSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/* ─── Chat (SSE POST) ──────────────────────────────────────────────────────── */
export function createChatStream(
  message: string,
  sessionId: string,
  teamId = "cardekho-orchestrator"
): Promise<Response> {
  return fetch(`/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, team_id: teamId }),
  });
}

/* ─── HITL response ─────────────────────────────────────────────────────────── */
export function submitUserInput(
  runId: string,
  sessionId: string,
  data: Record<string, string>
): Promise<Response> {
  return fetch(`/api/hitl/${runId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, ...data }),
  });
}
