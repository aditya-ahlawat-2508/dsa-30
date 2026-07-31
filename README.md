# dsa-30

A personal, single-user, offline-first 30-day DSA revision tracker. 30 day-cards on a home grid;
each day holds exactly 8 question slots plus a markdown notes pad.

**All content is user-supplied.** The app ships with 240 empty, pre-numbered slots — it never
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
| `node scripts/make-template.mjs` | Regenerate `intake-template.csv` (240 blank rows) |
| `node scripts/sheet-to-plan.mjs <csv>` | Write CSV rows into `src/data/plan.json` |

## Data model

Two files, two lifetimes — see [CLAUDE.md](./CLAUDE.md#data-model) for the full schema:

- `src/data/plan.json` — the syllabus. In Git, read-only at runtime.
- localStorage `dsa-tracker:progress:v1` — ticks, stars, notes, and in-app overrides. Export it
  from **Settings** regularly; it's one "Clear browsing data" away from gone.
