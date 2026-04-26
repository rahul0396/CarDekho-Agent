import { type NextRequest, NextResponse } from "next/server";

const AGENTOS_URL = process.env["AGENTOS_URL"] ?? "http://localhost:7777";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sessionId = req.nextUrl.searchParams.get("session_id") ?? "";
  try {
    const upstream = await fetch(
      `${AGENTOS_URL}/v1/shortlist?session_id=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" }
    );
    const data: unknown = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ session_id: sessionId, entries: [] });
  }
}
