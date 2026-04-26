import { type NextRequest, NextResponse } from "next/server";

const AGENTOS_URL = process.env["AGENTOS_URL"] ?? "http://localhost:7777";

export async function POST(req: NextRequest) {
  let body: { message: string; session_id: string; team_id?: string };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, session_id, team_id = "cardekho-orchestrator" } = body;

  if (!message || !session_id) {
    return NextResponse.json({ error: "message and session_id required" }, { status: 400 });
  }

  try {
    const form = new FormData();
    form.append("message", message);
    form.append("session_id", session_id);
    form.append("stream", "true");

    const upstream = await fetch(`${AGENTOS_URL}/teams/${team_id}/runs`, {
      method: "POST",
      headers: { Accept: "text/event-stream" },
      body: form,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    // Pipe SSE stream directly to the client
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
