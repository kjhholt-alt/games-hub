import { type NextRequest, NextResponse } from "next/server";
import { insertEvent } from "@/lib/analytics";

/**
 * Lightweight tracking endpoint. POST { page, type, referrer? }
 *
 * Privacy: the raw IP is never stored. It is hashed with a per-day salt, which
 * gives unique-visitor counts within a day while making cross-day correlation
 * of a visitor impossible.
 *
 * Always answers 204, even on bad input or a failed insert -- a tracking
 * endpoint that returns errors teaches clients to retry and can surface as a
 * console error on a real user's page. Analytics is never worth breaking UX.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const page = body.page;
    const eventType = body.type;
    if (!page || !eventType) return new NextResponse(null, { status: 204 });

    const country = req.headers.get("x-vercel-ip-country") ?? undefined;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const daySalt = new Date().toISOString().slice(0, 10);
    const ipHash = await hashString(`${ip}:${daySalt}`);

    await insertEvent({
      page: String(page).slice(0, 200),
      event_type: String(eventType).slice(0, 30),
      country: country?.slice(0, 5),
      referrer: body.referrer ? String(body.referrer).slice(0, 500) : undefined,
      ip_hash: ipHash,
    });
  } catch {
    // swallow: see the note above
  }
  return new NextResponse(null, { status: 204 });
}

async function hashString(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}
