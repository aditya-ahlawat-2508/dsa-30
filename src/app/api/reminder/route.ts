import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * This route has no auth (the whole app is a client-only, single-user tool
 * with no login) and is reachable at a guessable path if deployed publicly.
 * Left unguarded, it would let anyone who finds the URL spam arbitrary
 * inboxes through this project's Resend account/sending reputation. The one
 * cheap mitigation that fits a no-auth app: if REMINDER_ALLOWED_EMAIL is set,
 * only that address is ever sent to, regardless of what a caller requests.
 * Set it in your deployment env — see README for setup.
 */
function resolveAllowedEmail(requested: string): { ok: true; email: string } | { ok: false; error: string } {
  const allowed = process.env.REMINDER_ALLOWED_EMAIL;
  if (!allowed) {
    console.warn(
      "dsa-30: REMINDER_ALLOWED_EMAIL is not set — /api/reminder will send to whatever email the caller provides. Set it before deploying publicly."
    );
    return { ok: true, email: requested };
  }
  if (requested !== allowed) {
    return { ok: false, error: "email does not match the configured recipient" };
  }
  return { ok: true, email: allowed };
}

async function sendReminder(email: string): Promise<NextResponse> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY is not configured on the server" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "dsa-30 <onboarding@resend.dev>",
      to: email,
      subject: "dsa-30 — today's reps aren't done yet",
      text: "You haven't logged a solve today. Open dsa-30 and knock out at least one question before the day resets.",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown error" }, { status: 500 });
  }
}

// Option A (built): Vercel Cron hits this via GET once a day — see
// vercel.json. Cron requests carry no body, so the recipient comes from
// REMINDER_ALLOWED_EMAIL. Vercel also signs cron requests with an
// `Authorization: Bearer $CRON_SECRET` header when CRON_SECRET is set in the
// project env — verified below so the cron path can't be triggered by anyone
// who just finds the URL.
//
// Option B (built, see Settings): a manual "Send test email" button that
// POSTs here with the browser's locally-known `hasSolvedToday`, so you can
// verify the email pipeline works before wiring up the cron.
//
// Neither option currently checks "already solved today" from the cron path
// — that would need a small server-side KV (Vercel KV free tier, or a single
// row in a free Supabase table) written by the client on solve and read here,
// since a cron function can't see the browser's localStorage. Without that,
// the cron just sends unconditionally every day, which is fine for a
// single-user daily nudge.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const email = process.env.REMINDER_ALLOWED_EMAIL;
  if (!email) {
    return NextResponse.json({ error: "REMINDER_ALLOWED_EMAIL is not configured" }, { status: 500 });
  }

  return sendReminder(email);
}

export async function POST(request: Request) {
  let body: { email?: unknown; hasSolvedToday?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const requested = typeof body.email === "string" ? body.email.trim() : "";
  if (!requested || !EMAIL_RE.test(requested)) {
    return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  }

  if (body.hasSolvedToday === true) {
    return NextResponse.json({ skipped: true, reason: "already solved today" });
  }

  const resolved = resolveAllowedEmail(requested);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 403 });
  }

  return sendReminder(resolved.email);
}
