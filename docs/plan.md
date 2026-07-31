# 30-Day DSA Revision Tracker — Build Plan & Claude Spec

A single-user, offline-first web app. 30 day-cards on a home grid; tapping one opens that day's
list of **8 questions** (checkbox + link + difficulty + star) and a persistent notes pad.

**Content ownership:** every question and every link is supplied by you. Claude builds the
container; it never invents, suggests, or auto-fills a question. The seed file ships with 240
empty, pre-numbered slots (30 days × 8) and you fill them in.

---

## 0. The one rule to repeat in every prompt

> The app has exactly 8 question slots per day, 240 total. All question titles, links,
> difficulties, and topic labels are user-supplied. Do not generate example questions, do not
> suggest a curriculum, and do not populate any slot with placeholder content beyond an empty
> slot marker.

Claude's default behaviour on a DSA project is to helpfully fill in "Two Sum, 3Sum, Container With
Most Water…". State this rule explicitly or you will spend time deleting content.

---

## 1. Gaps in the original spec, and what to add

Your four requirements are the skeleton. These are the ones worth adding, ranked.

### Must-have (fix real problems)

| Addition | Why |
|---|---|
| **Tri-state status instead of a checkbox** | `unsolved / solved-clean / solved-with-hint / solved-with-editorial`. A binary tick tells you nothing on revision day 2. Highest-value change to your spec. |
| **Stable question IDs, pre-allocated** | `d01-q03`. All 240 IDs exist from the first commit, before any content. Progress binds to the ID, so filling in a slot later never disturbs a tick. |
| **Empty-slot rendering** | A slot with no title is a real, visible thing: "Slot 4 — empty". Not a blank row, not a crash. This is the normal state for most of the app on day one. |
| **Export / Import JSON** | localStorage is one "Clear browsing data" away from gone. Non-negotiable for 30 days of notes. |
| **Per-day progress bar + global progress** | Straight from your screenshot 1. Denominator is 8 per day, 240 global. |
| **Difficulty tag with colour** | Easy green / Medium amber / Hard red, as in screenshot 2. |
| **Star / "revisit"** | Screenshot 2 has it. Feeds a "Starred" view — becomes your night-before-interview list. |

### High-value (small effort, big return)

| Addition | Why |
|---|---|
| **Two note scopes** | Per-question note (one line: "off-by-one in the shrink condition") + per-day concept note (long markdown). Your spec only had the second. |
| **Multiple links per question** | `primary` (LeetCode/GFG), `editorial`, `video`. Screenshot 2 shows exactly this pattern. |
| **Pattern tag** | Free-text like `monotonic stack`, `binary search on answer`. Lets you filter *by pattern across all 30 days* — the real revision superpower. |
| **`attempts` counter + `lastSolvedAt`** | Enables spaced repetition and a streak counter. |
| **Global search / filter** | "show me everything unsolved", "everything starred", "all Hard". |
| **Keyboard shortcuts** | `j`/`k` to move, `space` to cycle status, `n` to focus notes. You'll be in this daily; mouse-only will annoy you. |

### Phase 2 / optional

- **Spaced repetition surfacing** — a "Due for revision" strip showing questions solved 7 and 21 days ago.
- **Heatmap** — GitHub-style contribution grid over the 30 days.
- **Cross-device sync** — see §5.
- **Timer** — per-question stopwatch. Sounds good, rarely used. Skip in v1.

### Deliberately skip

Auth, multi-user, comments, a backend database in v1, code editor / submission storage. You have
LeetCode for the last one; duplicating it kills the project.

---

## 2. Data model

Two files, two lifetimes. This split is the architectural core of the whole app.

### 2a. Syllabus — `src/data/plan.json` (in Git, read-only at runtime)

Ships with all 240 slots present and empty. You fill them in over time.

```json
{
  "schemaVersion": 1,
  "title": "30-Day DSA Revision",
  "startDate": "2026-08-04",
  "questionsPerDay": 8,
  "days": [
    {
      "day": 1,
      "topic": "",
      "goal": "",
      "questions": [
        {
          "id": "d01-q01",
          "title": "",
          "difficulty": "",
          "pattern": "",
          "tags": [],
          "links": { "primary": "", "editorial": "", "video": "" }
        }
        // ... d01-q02 through d01-q08, identical empty shape
      ]
    }
    // ... days 2 through 30
  ]
}
```

Rules:

- **All 240 IDs are generated once, at scaffold time, and never change.** Format `d{DD}-q{NN}`,
  zero-padded, `NN` from `01` to `08`.
- A slot is **empty** if `title` is `""`. Empty slots render as a slot marker, count toward the
  denominator, and are never counted as solved.
- `topic` and `goal` are yours to name. Leave them `""` and the card shows the day number alone.
- `difficulty` is `Easy | Medium | Hard`, or `""` while unfilled.
- Empty link strings are legal and render as a greyed-out, disabled icon.

### 2b. Progress — localStorage key `dsa-tracker:progress:v1`

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-01T18:22:04.113Z",
  "questions": {
    "d01-q01": {
      "status": "solved-clean",
      "starred": false,
      "attempts": 1,
      "lastSolvedAt": "2026-08-04T09:11:00.000Z",
      "note": "two-pass hashmap; watch the i != j guard",
      "linkOverride": null,
      "titleOverride": null,
      "difficultyOverride": null,
      "patternOverride": null
    }
  },
  "dayNotes": {
    "1": "## Prefix sums\n\nsum(i..j) = pre[j] - pre[i-1] ..."
  },
  "extraQuestions": {
    "1": [
      {
        "id": "d01-c01",
        "title": "",
        "difficulty": "",
        "pattern": "",
        "tags": [],
        "links": { "primary": "" }
      }
    ]
  }
}
```

- The `*Override` fields are how you fill or fix a slot **from inside the app** without touching
  the repo. Filling slot `d01-q03` on your phone writes `titleOverride` + `linkOverride`; the
  syllabus file stays untouched until you export (§3, promotion path).
- `extraQuestions` is overflow only — for the day you decide 8 wasn't enough. IDs use a `c` prefix
  so they can never collide with the 240 fixed slots. The day denominator becomes `8 + extras`.
- `schemaVersion` exists so a future you writes a migration instead of nuking your data.

### 2c. The merge

```
displayedQuestions(day) =
    plan.days[day].questions  ++  progress.extraQuestions[day]
      .map(q => {
        const p = progress.questions[q.id] ?? DEFAULT_STATE;
        return { ...q, ...p,
                 title:      p.titleOverride      ?? q.title,
                 url:        p.linkOverride       ?? q.links.primary,
                 difficulty: p.difficultyOverride ?? q.difficulty,
                 pattern:    p.patternOverride    ?? q.pattern,
                 isEmpty:    (p.titleOverride ?? q.title) === "" };
      })
```

Progress is never stored inside the syllabus object. Ever.

---

## 3. How your questions and links actually get in

You are supplying 240 questions. That's a bulk data-entry problem first and a UI problem second,
so the methods are ordered by throughput.

### Method 1 — Intake sheet → generator script *(primary path, for the bulk of the 240)*

Keep a spreadsheet. One row per question, 240 rows:

| day | slot | title | difficulty | url | pattern |
|---|---|---|---|---|---|
| 1 | 1 | *(your question)* | Medium | *(your link)* | *(your label)* |
| 1 | 2 | … | … | … | … |

Fill it while browsing whatever sheet you're pulling from — TUF, LeetCode lists, your own starred
set. Filling a spreadsheet is roughly 10× faster than any in-app form, and it's the one context
where you can see a whole day's eight questions at once and rebalance them.

Then run `scripts/sheet-to-plan.mjs`, which reads the CSV and writes `src/data/plan.json`.

Generator rules to specify:
- `day` — 1–30, `slot` — 1–8. ID is derived as `d{day:02}-q{slot:02}`.
- **Rows are matched into existing slots by (day, slot), not appended.** Re-running the script
  after adding 20 more rows must not renumber anything already there.
- A missing row leaves that slot empty rather than shifting later ones up.
- Error loudly on a duplicate `(day, slot)` pair or an out-of-range value. Silent overwrite here
  costs you notes.
- `title` may be blank if `url` is present — see the slug derivation below.

You do not have to fill all 240 before starting. Fill day 1, run the script, use the app,
fill more as you go, re-run. The slot-matching rule is what makes that safe.

### Method 2 — Paste-a-day importer *(fastest in-app path)*

A textarea on each day page. You paste up to 8 lines:

```
https://leetcode.com/problems/two-sum/
https://leetcode.com/problems/3sum/ | Medium | two pointers
Longest Consecutive Sequence | Medium | hashset | https://leetcode.com/problems/lcs/
```

Parser rules:
- One question per line, filling slots 1–8 in order. Refuse the import if it exceeds the number
  of empty slots remaining, and say which lines don't fit.
- Split on `|`, trim each field. A field matching `^https?://` is a URL; a field matching
  `^(Easy|Medium|Hard)$` is difficulty; the first remaining field is the title; anything left is
  the pattern.
- If no title was given but a LeetCode/GFG URL was, **derive the title from the slug**:
  `/problems/longest-consecutive-sequence/` → `Longest Consecutive Sequence` (split on `-`,
  capitalise words, then an overrides map for `Bst → BST`, `Ii → II`, `Lru → LRU`, `Kth`).
- Difficulty defaults to `""`, not `Medium`. Don't let the app guess data you own.
- **Always show a preview table of what will go into which slot, with an explicit Add button.**
  Never import silently on paste.

This is what you'll use the night before a session: copy eight URLs, paste, done.

### Method 3 — Inline slot edit *(one-off fills and fixes)*

Every row — filled or empty — has a pencil that opens a small popover: title, URL, difficulty,
pattern. Saving writes the `*Override` fields into progress. This is the mobile path, for when a
link is dead mid-revision or you want to swap one question out.

### Method 4 — "Add extra question" on the day page

Only appears once all 8 slots are filled. Writes into `extraQuestions[day]`.

### Promotion path — getting in-app edits back into Git

Browser storage is a working buffer; **Git is durable truth.**

Build `Settings → Export plan.json`, emitting the *merged* syllabus — the 240 slots with all
overrides applied and extras appended, progress fields stripped. Drop that file over
`src/data/plan.json`, commit. Everything you typed on your phone is now permanent and
version-controlled.

Also emit `Export intake.csv` in the Method 1 column format, so your spreadsheet and your app
never drift apart.

Pair both with `Export progress.json` / `Import progress.json` for the ticks and notes themselves.

### Optional — auto-fetching difficulty from a link you provided

LeetCode has a GraphQL endpoint (`https://leetcode.com/graphql`, `questionData(titleSlug:)`)
returning title, difficulty, topic tags. You **cannot** call it from the browser — CORS blocks it.
If you want it, add `app/api/leetcode/route.ts` that takes a slug and calls it server-side with a
browser-like `User-Agent`.

This fills in metadata for links *you* supplied; it never chooses a question. Treat it as a
convenience with a fallback: unofficial, rate-limited, breaks without notice. Manual entry must
always still work, and a failed fetch pre-fills nothing rather than blocking the import.

---

## 4. Tech stack

| Layer | Choice | Note |
|---|---|---|
| Framework | **Next.js 15, App Router** | You know it; you want a route handler for §3's proxy; Vercel deploy is free and gives phone access. Skipping the proxy? Vite + React is lighter and equally fine. |
| Styling | **Tailwind v4** | |
| State | **Zustand** + `persist` middleware | Redux is overkill; prop-drilling 30 days deep is worse. |
| Notes editor | `<textarea>` + `react-markdown` preview | Do not pull in a rich-text editor. Markdown in a textarea is faster to build and faster to type. |
| Animation | Motion, sparingly | Day-card hover, panel open. Nothing on the status control — it must feel instant. |
| Icons | lucide-react | |

**Critical:** the day page is `'use client'` and reads storage in a `useEffect`, not during render.
Reading localStorage during SSR/first render causes a hydration mismatch and React will throw.
Render a skeleton until hydrated.

**Write storage behind an interface from day one:**

```ts
interface ProgressStore {
  load(): Promise<ProgressData>;
  save(data: ProgressData): Promise<void>;
}
```

Implement `LocalStorageStore` now. Later sync = write `SupabaseStore`, change one line. Do not
scatter `localStorage.getItem` across components.

---

## 5. The cross-device problem (decide before you start)

localStorage is scoped to one browser on one device. Tick something on your laptop and your phone
won't know. For a personal tracker that's usually fine — but choose consciously:

- **Accept it** — one primary device, Export/Import to move data occasionally. Zero extra work.
  Recommended for v1.
- **Sync later** — Supabase free tier, one `progress` table, single hardcoded user. About an
  evening's work *if* you built the storage interface above. Phase 6, not Phase 1.

---

## 6. Build phases — what to give Claude, in order

Six sessions, each ending in something that runs. Repeat the §0 rule at the top of each prompt.

### Phase 0 — Scaffold, types, empty seed, generator script

> Set up a Next.js 15 App Router project with TypeScript and Tailwind v4 called `dsa-30`.
>
> Create `src/types/index.ts` with types for the two schemas below, then generate
> `src/data/plan.json` containing all 30 days, each with exactly 8 question slots. **Every slot is
> empty**: `title`, `difficulty`, `pattern` are `""`, `tags` is `[]`, all links are `""`. Day
> `topic` and `goal` are `""` too. IDs are `d01-q01` through `d30-q08`, zero-padded.
>
> Do not invent any questions, topics, or a curriculum. I supply all content myself.
>
> [paste the two JSON schemas from §2a and §2b]
>
> Also write `scripts/sheet-to-plan.mjs`: reads a CSV with columns `day,slot,title,difficulty,url,
> pattern` and writes `plan.json`, matching rows into existing slots by `(day, slot)` rather than
> appending. Re-running after adding rows must not renumber or disturb existing slots. Error
> loudly on duplicate or out-of-range `(day, slot)`. Blank `title` with a present `url` gets the
> title derived from the URL slug.
>
> Also emit `intake-template.csv` — 240 pre-filled rows of `day,slot` with the other columns
> blank, so I can open it in a spreadsheet and start typing.
>
> Constraints: IDs never derived from array position. Progress data never written into
> `plan.json`. No UI yet.

The `intake-template.csv` is the deliverable that matters here — it's what you actually go and
fill in.

### Phase 1 — Home grid + day route

> Build the home page: a responsive grid of 30 day cards (5 cols desktop, 3 tablet, 2 mobile).
> Each card shows the day number as the dominant element, the topic name if set, an `x / 8`
> solved count, and a thin progress bar across the top of the card — match the reference
> screenshot: a full-width rule above the card body, filled portion in the accent colour,
> unfilled in a 15%-opacity tint of it.
>
> A day whose 8 slots are all still empty renders in a muted state with a "not planned yet"
> affordance. A day fully solved gets a filled check badge.
>
> Above the grid: a global progress bar showing solved / 240, a "planned" count of non-empty
> slots, and a current streak.
>
> Tapping a card routes to `/day/[day]`, which lists the 8 slots in order. Empty slots render as
> a dashed row reading "Slot N — empty" with an add affordance. Static for now: no interactivity,
> no persistence, read from `plan.json` only.

### Phase 2 — Persistence, status, notes

The phase where correctness matters most. Be explicit:

> Add the progress layer.
>
> 1. `src/lib/storage.ts` — a `ProgressStore` interface with `load()`/`save()`, plus
>    `LocalStorageStore` on key `dsa-tracker:progress:v1`. Handle key absent, malformed JSON, and
>    `schemaVersion` mismatch: log and fall back to empty state. Never crash, never silently
>    discard.
> 2. A Zustand store with `persist` wrapping it. All reads/writes go through it; no component
>    touches `localStorage` directly.
> 3. Replace the static tick with a **four-state control** cycling `unsolved → solved-clean →
>    solved-with-hint → solved-with-editorial → unsolved`. Distinguish by shape and fill, not
>    colour alone. Any transition into a solved state increments `attempts` and stamps
>    `lastSolvedAt`. **The control is disabled on an empty slot** — you can't solve a question
>    that isn't there.
> 4. Star toggle per question, also disabled on empty slots.
> 5. Per-question one-line note, inline, under the row when expanded.
> 6. Per-day concept notes: markdown textarea with preview toggle, autosaving 400ms after typing
>    stops, with a visible "Saved" indicator. **Notes are enabled regardless of whether slots are
>    filled** — I want to write concept notes before planning the questions.
>
> Hydration: client component, read storage in an effect, skeleton until hydrated, so SSR and
> first client render match.
>
> Merge rule: [paste §2c].

### Phase 3 — Question and link entry

> Implement Methods 2, 3 and 4:
> [paste §3 Methods 2–4 and the promotion path]
>
> Implement the paste-importer parser rules exactly as written, including the refusal when the
> line count exceeds remaining empty slots, and always show a slot-by-slot preview with an
> explicit "Fill N slots" button before writing anything.

### Phase 4 — Views and filters

> Add `/browse`: all 240 slots in one table, filters for status, difficulty, starred, day range,
> empty/filled, and free-text search over title and pattern. A "Starred" quick filter from the
> home page.
>
> Add a "Due for revision" strip on the home page: questions whose `lastSolvedAt` is 7 or 21 days
> ago, or solved-with-editorial and older than 3 days.

### Phase 5 — Polish

> Keyboard shortcuts on the day page: `j`/`k` move selection, `space` cycles status, `s` stars,
> `e` opens the slot editor, `n` focuses notes, `/` focuses search, `?` opens a shortcut overlay.
>
> Export/Import for `plan.json`, `intake.csv`, and `progress.json` in Settings, with a confirm
> step on import showing what will be overwritten.
>
> Accessibility: visible focus rings, status control is a real button with an `aria-label`
> describing current state, `prefers-reduced-motion` respected.

### Phase 6 (optional) — Sync

> Add `SupabaseStore` implementing `ProgressStore`, backed by one `progress` table keyed by a
> hardcoded user id. Change the store construction site only. Keep `LocalStorageStore` as an
> offline fallback, last-write-wins on reconnect.

---

## 7. Traps to state explicitly in your prompts

Claude gets these wrong by default unless told. Include verbatim:

1. **Do not invent questions.** All 240 slots ship empty; content is user-supplied.
2. **Never key progress by array index.** Only by stable `id`.
3. **Never write progress into `plan.json`.** Two files, two lifetimes.
4. **An empty slot is a first-class UI state**, not a blank row and not an error.
5. **No `localStorage` access during render.** Effect only, skeleton until hydrated.
6. **Debounce notes autosave** (~400ms). Writing per keystroke will jank on long notes.
7. **`JSON.parse` on stored data wrapped in try/catch.** One corrupt write must not brick the app.
8. **Empty link renders as a disabled icon, not `<a href="">`.** An empty href navigates to the
   current page.
9. **External links need `target="_blank" rel="noopener noreferrer"`.**
10. **Difficulty not communicated by colour alone** — include the text label, as your reference
    screenshot does.

---

## 8. Your intake sheet

The app ships empty; this is the artifact you actually author. Six columns, 240 rows,
`intake-template.csv` generated for you in Phase 0.

```csv
day,slot,title,difficulty,url,pattern
1,1,,,,
1,2,,,,
...
30,8,,,,
```

Filling guidance:

- **`title`** — optional if `url` is a LeetCode or GFG link; the script derives it from the slug.
  Fill it manually when the derived title would be ugly or when the link is a blog/editorial.
- **`difficulty`** — `Easy` / `Medium` / `Hard`, or leave blank. Blank stays blank; the app won't
  guess.
- **`url`** — the one link you'll click to open the problem. Editorial and video links are
  separate fields you add in-app later if you want them; keep the sheet to one URL per row so the
  bulk pass stays fast.
- **`pattern`** — your own label, and the highest-leverage column in the sheet. `binary search on
  answer`, `monotonic stack`, `LIS variant`. In Phase 4 this becomes a cross-day filter, which is
  what turns 240 rows into an actual revision tool rather than a checklist.
- **Day `topic` / `goal`** — not in the CSV. Set them in-app, or hand-edit `plan.json` once.

You don't need all 240 before you start. Fill the first few days, run the script, use the app,
keep filling. The slot-matching rule in §3 Method 1 is what makes incremental filling safe.

---

## 9. Definition of done for v1

- `plan.json` exists with all 240 slots, IDs correct and stable, all empty.
- `scripts/sheet-to-plan.mjs` runs twice in a row on a growing CSV without renumbering anything.
- Fill day 1 from the spreadsheet; day 1 renders 8 real rows, days 2–30 render 8 empty slots each.
- Paste 8 bare LeetCode URLs into day 2's importer; titles derive correctly, preview shows the
  slot mapping, nothing writes until you confirm.
- Tick a question, hard-refresh, close the browser, reopen — state survives.
- Write a note on day 3 (whose slots are still empty), navigate away and back — note intact.
- Export progress, clear site data, import it back — nothing lost.
- Export `plan.json` after filling slots on your phone, drop it into the repo, commit — the app
  loads identically from the seed with an empty localStorage.
- Usable one-handed on your phone.
