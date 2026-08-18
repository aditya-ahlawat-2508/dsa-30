# dsa-30

A personal, single-user, offline-first 30-day DSA revision tracker. 30 day-cards on a home grid;
slot count per day varies (see [CLAUDE.md](./CLAUDE.md)), each with a markdown notes pad.

**All content is user-supplied.** The app ships with empty, pre-numbered slots — it never
invents, suggests, or auto-fills a question. See [CLAUDE.md](./CLAUDE.md) for the full rules and
[docs/plan.md](./docs/plan.md) for the original build spec.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zustand · react-markdown · lucide-react

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Filling in your questions

The fastest path for bulk entry is the CSV → generator script:

1. Open `intake-template.csv` in a spreadsheet and fill in `title` (optional if `url` is a
   LeetCode/GFG link), `difficulty`, `url`, `pattern` for whichever `(day, slot)` rows you have.
2. Run:
   ```bash
   node scripts/sheet-to-plan.mjs intake-template.csv
   ```
   This writes `src/data/plan.json`, matching rows into their `(day, slot)` slot. Re-running it
   after adding more rows never renumbers or disturbs slots you already filled.
3. Commit `src/data/plan.json`.

You can also fill slots from inside the running app (paste importer, inline slot editor, or
"add extra question" on a day page) — those write to browser `localStorage` as overrides. Use
**Settings → Export plan.json** to bring in-app edits back into this file for a permanent,
version-controlled copy.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `node scripts/make-template.mjs` | Regenerate `intake-template.csv` (one row per slot) |
| `node scripts/sheet-to-plan.mjs <csv>` | Write CSV rows into `src/data/plan.json` |

## Data model

Two files, two lifetimes — see [CLAUDE.md](./CLAUDE.md#data-model) for the full schema:

- `src/data/plan.json` — the syllabus. In Git, read-only at runtime.
- localStorage `dsa-tracker:progress:v1` — ticks, stars, notes, in-app overrides, streak/badge
  state, and your reminder email. Export it from **Settings** regularly; it's one "Clear browsing
  data" away from gone.

## Streaks, freezes, badges

- The home page shows a GitHub-style activity heatmap and current streak. A day counts as active
  if you solved something or wrote a day note.
- One streak freeze is granted per rolling 30 days (since you first opened the app) and
  auto-consumes to bridge a single missed day, so one off day doesn't zero out a long streak.
  Multi-day gaps still break it past the one bridged day.
- Badges (7/30/100-day streaks, first solve, 10 solved, first DP solve, all days planned) are at
  **/badges**, and fire a toast the moment they're newly earned.

## Email reminders (optional, needs a small backend)

The app itself is 100% client-side — a browser tab can't send email once it's closed. Sending a
daily reminder needs a bit of server-side infrastructure:

1. **Get a [Resend](https://resend.com) API key** (free tier is generous enough for a daily
   single-recipient email).
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `RESEND_API_KEY` — required.
   - `RESEND_FROM_EMAIL` — optional; defaults to Resend's onboarding sender (fine for testing,
     but verify your own sending domain in Resend before relying on this for real).
   - `REMINDER_ALLOWED_EMAIL` — **strongly recommended** once deployed publicly. `/api/reminder`
     has no auth (nothing in this app does), so without this, anyone who finds the URL could use
     your Resend account to send mail to arbitrary addresses. Set it and the route only ever
     sends to this one address, regardless of what a caller requests.
3. In **Settings**, enter your reminder email and click **Send test email** to confirm the
   pipeline works — this needs no cron or deployment, just `RESEND_API_KEY` set locally.
4. **For an actual daily reminder** (the tab doesn't need to be open), deploy to Vercel:
   `vercel.json` already configures a daily cron hitting `/api/reminder` at 15:30 UTC (≈ 9 PM
   IST). Set the same env vars in the Vercel project settings. Optionally set `CRON_SECRET` too —
   Vercel automatically signs its cron requests with it, so the endpoint can verify the request
   really came from Vercel Cron and not from someone who found the URL.
   - The cron currently sends unconditionally every day — it has no way to know if you've already
     solved something today, since a cron job can't read your browser's localStorage. Wiring that
     up would mean a small server-side KV (Vercel KV free tier, or a single row in a free
     Supabase table) that the client writes to on solve and the cron route reads before sending —
     left as a TODO in `src/app/api/reminder/route.ts`, not built.
