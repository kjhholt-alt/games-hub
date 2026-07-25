/**
 * Server-side analytics insert. Mirrors the pattern proven on
 * pc-bottleneck-analyzer, whose analytics_events table already carries a
 * `site` column -- so this site is an additional writer, not a new schema.
 *
 * Silent by design: analytics must never break a page render. Every failure
 * path returns false rather than throwing.
 *
 * Inert until SUPABASE_URL + SUPABASE_SERVICE_KEY exist in the Vercel project
 * env. That is deliberate -- shipping the instrumentation and switching it on
 * are separate steps.
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

export const SITE = "buildkitplay";

export interface AnalyticsEvent {
  page: string;
  event_type: string;
  country?: string;
  referrer?: string;
  ip_hash?: string;
}

export function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export async function insertEvent(event: AnalyticsEvent): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ site: SITE, ...event }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
