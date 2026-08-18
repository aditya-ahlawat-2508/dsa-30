# dsa-30

A personal, single-user, offline-first 30-day DSA revision tracker. 30 day-cards on a home grid.
Slot count per day is **not uniform**: days 1–10 hold 10 slots (a 100-question sprint), days
11–18 hold 9 slots (a 96-question batch, short of the ideal 10/day because the source mixed-topic
pool only had 63 available questions), days 19–30 hold the original 8 slots each — 268 slots
total. Each day also has a markdown notes pad. Slot count for a given day is read from
`plan.days[day].questions.length`, never from a single global constant — no component or script
may assume every day has the same number of slots.

## Non-negotiables

These are the rules that break the app if violated. Check every change against them.

1. **Never invent DSA questions.** All question titles, links, difficulties, topic labels and
   patterns are supplied by the user (or extracted verbatim from user-supplied source material,
   e.g. screenshots of a real problem list). Slots ship empty until then. Do not populate a slot
   with an example, do not propose a curriculum, do not "helpfully" fill a blank with Two Sum.
   An empty slot is the correct state.
2. **Question IDs are pre-allocated and immutable.** `d01-q01` … `d10-q10` (days 1–10), `d11-q01`
   … `d18-q09` (days 11–18), `d19-q01` … `d30-q08` (days 19–30), zero-padded. Never derive an ID
   from array position. Never renumber. Per-day slot count comes from
   `scripts/lib/csv-columns.mjs`'s `slotsForDay(day)` helper — update it (and only it) if the
   per-day slot count ever needs to change again.
3. **Two files, two lifetimes.** `src/data/plan.json` is the syllabus (Git, read-only at
   runtime). localStorage `dsa-tracker:progress:v1` is progress. Progress fields must never be
   written into `plan.json`, and syllabus content must never be the only copy of something the
   user typed in-app.
4. **An empty slot is a first-class UI state**, not a blank row and not an error. It renders as a
   labelled dashed row with an add affordance. Status and star controls are disabled on it.
5. **Day notes work on unplanned days.** The notes pad is enabled even when all of a day's slots
   are empty — the user writes concept notes before choosing questions.
6. **No `localStorage` access during render.** Read in an effect, show a skeleton until hydrated.
   Reading during SSR/first render causes a hydration mismatch and React throws.

## Data model

`src/data/plan.json` — syllabus:

```
{ schemaVersion, title, startDate, questionsPerDay,
  days: [ { day, topic, goal,
            questions: [ { id, title, difficulty, pattern, tags, links: {primary, editorial, video} } ] } ] }
```

`questionsPerDay` is informational only (no component reads it) — actual slot count per day is
`days[i].questions.length`, which varies (10 for days 1–10, 8 for days 11–30). Do not reintroduce
a hardcoded assumption that every day has the same slot count.

A slot is empty iff `title === ""`. `difficulty` is `Easy | Medium | Hard | ""`.

localStorage `dsa-tracker:progress:v1` — progress:

```
{ schemaVersion, updatedAt,
  questions: { [id]: { status, starred, attempts, lastSolvedAt, note,
                       linkOverride, titleOverride, difficultyOverride, patternOverride } },
  dayNotes:  { [day]: markdown },
  extraQuestions: { [day]: Question[] } }
```

`status` — `unsolved | solved-clean | solved-with-hint | solved-with-editorial`.

The `*Override` fields let the user fill or fix a slot from inside the app without touching the
repo. `extraQuestions` is overflow past a day's fixed slot count; IDs use a `c` prefix (`d01-c01`)
so they can never collide with the pre-allocated slots.

Merge at render time, by `id`:

```
displayed = plan.days[day].questions ++ extraQuestions[day], each mapped to:
  { ...q, ...(progress.questions[q.id] ?? DEFAULT),
    title:      titleOverride      ?? q.title,
    url:        linkOverride       ?? q.links.primary,
    difficulty: difficultyOverride ?? q.difficulty,
    pattern:    patternOverride    ?? q.pattern,
    isEmpty:    (titleOverride ?? q.title) === "" }
```

## Conventions that differ from defaults

- **Storage goes through `ProgressStore`** (`src/lib/storage.ts`), an interface with
  `load()`/`save()`. `LocalStorageStore` is the only implementation today; a Supabase one may
  come later. No component calls `localStorage` directly.
- **Zustand + `persist`** for state. Not Redux, not context-and-prop-drilling.
- **Notes autosave is debounced ~400ms**, never per keystroke.
- **All stored-JSON parsing is wrapped in try/catch**, with `schemaVersion` mismatch logged and
  falling back to empty state. One corrupt write must not brick the app.
- **Never render `<a href="">`** for a missing link — an empty href navigates to the current page.
  Missing links render as a disabled, greyed icon.
- External links always get `target="_blank" rel="noopener noreferrer"`.
- **Difficulty is never colour-only** — the text label always shows alongside.
- **Destructive imports always preview first.** The paste importer and any JSON import show
  exactly what will be written, to which slots, behind an explicit confirm button.
- Notes are a plain `<textarea>` plus `react-markdown` preview. Do not introduce a rich-text
  editor.
- Motion is used sparingly (card hover, panel open). Never animate the status control — toggling
  must feel instant.

## Bulk data entry

`scripts/sheet-to-plan.mjs` reads a CSV (`day,slot,title,difficulty,url,pattern`) and writes
`plan.json`. It **matches rows into existing slots by `(day, slot)`** rather than appending or
rebuilding, so re-running it after the user adds more rows never renumbers or disturbs existing
slots. It errors loudly on duplicate or out-of-range `(day, slot)`. A blank `title` with a
present LeetCode/GFG `url` gets its title derived from the URL slug.

Slug derivation: split on `-`, capitalise words, then apply an overrides map
(`Bst → BST`, `Ii → II`, `Iii → III`, `Lru → LRU`, `Kth → Kth`).

## Quality floor

Responsive to mobile (used one-handed on a phone), visible keyboard focus, `prefers-reduced-motion`
respected, status control is a real `<button>` with an `aria-label` describing its current state.
