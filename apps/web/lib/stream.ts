import { z } from "zod";
import type { SSEEvent } from "./types";

/* ─── AgentOS native event schema (what the backend actually emits) ─────────
   AgentOS sends events like `TeamRunContent`, `RunContent`, `ToolCallStarted`,
   `TeamRunError`, etc. We translate them into our normalized SSEEvent union
   that Chat.tsx consumes.
─────────────────────────────────────────────────────────────────────────── */

const AgnoToolSchema = z.object({
  tool_name: z.string().optional(),
  tool_args: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
});

const AgnoEventSchema = z.object({
  event: z.string(),
  content: z.unknown().optional(),
  agent_name: z.string().optional(),
  team_name: z.string().optional(),
  tool: AgnoToolSchema.optional(),
  run_id: z.string().optional(),
  parent_run_id: z.string().optional(),
});

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/* Translate a single AgentOS event into zero-or-more normalized SSEEvents. */
function translateAgnoEvent(raw: unknown): SSEEvent[] {
  const parsed = AgnoEventSchema.safeParse(raw);
  if (!parsed.success) return [];
  const e = parsed.data;

  switch (e.event) {
    // Streaming text chunks — both team-level and sub-agent-level
    case "TeamRunContent":
    case "RunContent": {
      const text = asString(e.content);
      if (!text) return [];
      return [{ type: "token", text }];
    }

    // Tool / member-delegation started
    case "TeamToolCallStarted":
    case "ToolCallStarted": {
      const tool = e.tool?.tool_name ?? "tool";
      const args = e.tool?.tool_args ?? {};
      const member = e.agent_name ?? e.team_name ?? "agent";
      return [{ type: "tool_call_started", member, tool, args }];
    }

    // Tool / member-delegation finished
    case "TeamToolCallCompleted":
    case "ToolCallCompleted": {
      const tool = e.tool?.tool_name ?? "tool";
      const member = e.agent_name ?? e.team_name ?? "agent";
      const result = asString(e.tool?.result) || asString(e.content);
      return [{ type: "tool_call_finished", member, tool, result }];
    }

    // Run finished cleanly
    case "TeamRunCompleted":
    case "RunCompleted":
      // Sub-agent RunCompleted fires for every member; only treat the team-level one as final.
      if (e.event === "RunCompleted" && e.parent_run_id) return [];
      return [{ type: "run_completed" }];

    // Run-level error (auth, rate limit, etc.) — propagate as run_error
    case "TeamRunError":
    case "RunError": {
      const msg = asString(e.content) || "An error occurred";
      // Detect a 429 from Anthropic so we surface a friendlier message
      if (/rate.?limit|429/i.test(msg)) {
        return [{ type: "rate_limited", retry_after: 30, message: "Hit Claude's rate limit. Please wait ~30 seconds and try again." }];
      }
      return [{ type: "run_error", message: msg }];
    }

    // Lifecycle noise — not user-visible
    case "TeamRunStarted":
    case "RunStarted":
    case "TeamModelRequestStarted":
    case "ModelRequestStarted":
    case "TeamModelRequestCompleted":
    case "ModelRequestCompleted":
    case "RunContentCompleted":
      return [];

    default:
      return [];
  }
}

/* Parse one `data: <json>` SSE line into normalized events. */
export function parseSSEEvent(raw: string): SSEEvent[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return translateAgnoEvent(parsed);
  } catch {
    return [];
  }
}

/* ─── SSE stream reader ─────────────────────────────────────────────────────
   AgentOS uses standard SSE framing: blank-line-separated frames where each
   frame has `event: <name>` + `data: <json>` lines. We only need the data
   line because the JSON body already includes the event name.
─────────────────────────────────────────────────────────────────────────── */
export async function* readSSEStream(
  response: Response
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines[lines.length - 1] ?? "";

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          for (const event of parseSSEEvent(data)) {
            yield event;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/* ─── Parse rich JSON payloads embedded in assistant text ─────────────────── */
export function extractRichPayload(text: string): {
  clean: string;
  payload: { type: string; data: unknown } | null;
} {
  const match = text.match(/\{"type":\s*"(listings|shortlist|comparison_table|review_summary|emi_results)"[^}]*"data":\s*(\[|\{)/);
  if (!match) return { clean: text, payload: null };
  try {
    const startIdx = text.indexOf(match[0]);
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = startIdx;
    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === "{" || ch === "[") depth++;
        if (ch === "}" || ch === "]") { depth--; if (depth === 0) { endIdx = i; break; } }
      }
    }
    const jsonStr = text.slice(startIdx, endIdx + 1);
    const parsed: unknown = JSON.parse(jsonStr);
    const clean = (text.slice(0, startIdx) + text.slice(endIdx + 1)).trim();
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      "data" in parsed
    ) {
      return { clean, payload: parsed as { type: string; data: unknown } };
    }
    return { clean: text, payload: null };
  } catch {
    return { clean: text, payload: null };
  }
}
