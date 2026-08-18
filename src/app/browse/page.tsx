"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { plan } from "@/lib/plan";
import { useHydrated } from "@/lib/useHydrated";
import { useProgressStore } from "@/store/useProgressStore";
import { displayedQuestionsForDay, type DisplayedQuestion } from "@/lib/merge";
import { COARSE_BUCKETS, bucketForPattern, type CoarseBucket } from "@/lib/topicBuckets";
import { TopNav } from "@/components/TopNav";
import { DifficultyTag } from "@/components/DifficultyTag";
import { StatusControl } from "@/components/StatusControl";
import type { Difficulty, QuestionStatus } from "@/types";

interface Row extends DisplayedQuestion {
  day: number;
}

const STATUS_OPTIONS: { value: QuestionStatus | "all"; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "unsolved", label: "Unsolved" },
  { value: "solved-clean", label: "Solved clean" },
  { value: "solved-with-hint", label: "Solved with hint" },
  { value: "solved-with-editorial", label: "Solved with editorial" },
];

export default function BrowsePage() {
  const hydrated = useHydrated();
  const progress = useProgressStore((s) => s.data);

  const [status, setStatus] = useState<QuestionStatus | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [dayMin, setDayMin] = useState(1);
  const [dayMax, setDayMax] = useState(30);
  const [fillState, setFillState] = useState<"all" | "empty" | "filled">("all");
  const [topic, setTopic] = useState<CoarseBucket | "all">("all");
  const [search, setSearch] = useState("");

  const rows: Row[] = useMemo(() => {
    const all: Row[] = [];
    for (const day of plan.days) {
      for (const q of displayedQuestionsForDay(day, progress)) {
        all.push({ ...q, day: day.day });
      }
    }
    return all;
  }, [progress]);

  // Topic buckets only mean something for filled slots — an empty slot has
  // no pattern to classify, so it's excluded from both the counts and the
  // filter rather than being force-fit into "Other".
  const topicCounts = useMemo(() => {
    const counts = new Map<CoarseBucket, number>();
    for (const r of rows) {
      if (r.isEmpty) continue;
      const bucket = bucketForPattern(r.pattern);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  const allTopics: CoarseBucket[] = [...COARSE_BUCKETS, "Other"];
  const topicOptions = allTopics.filter((b) => (topicCounts.get(b) ?? 0) > 0);

  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (difficulty !== "all" && r.difficulty !== difficulty) return false;
    if (starredOnly && !r.starred) return false;
    if (r.day < dayMin || r.day > dayMax) return false;
    if (fillState === "empty" && !r.isEmpty) return false;
    if (fillState === "filled" && r.isEmpty) return false;
    if (topic !== "all") {
      if (r.isEmpty || bucketForPattern(r.pattern) !== topic) return false;
    }
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      const haystack = `${r.title} ${r.pattern}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-bold">Browse — all {rows.length} slots</h1>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-card-border bg-card p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or pattern…"
            className="min-w-[10rem] flex-1 rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as QuestionStatus | "all")}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="all">Any difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="">Unset</option>
          </select>
          <select
            value={fillState}
            onChange={(e) => setFillState(e.target.value as "all" | "empty" | "filled")}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="all">Empty + filled</option>
            <option value="filled">Filled only</option>
            <option value="empty">Empty only</option>
          </select>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value as CoarseBucket | "all")}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="all">All topics</option>
            {topicOptions.map((b) => (
              <option key={b} value={b}>
                {b} ({topicCounts.get(b)})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={starredOnly} onChange={(e) => setStarredOnly(e.target.checked)} />
            Starred
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            Day
            <input
              type="number"
              min={1}
              max={30}
              value={dayMin}
              onChange={(e) => setDayMin(Number(e.target.value) || 1)}
              className="w-14 rounded-md border border-card-border bg-transparent px-1.5 py-1 text-sm"
            />
            to
            <input
              type="number"
              min={1}
              max={30}
              value={dayMax}
              onChange={(e) => setDayMax(Number(e.target.value) || 30)}
              className="w-14 rounded-md border border-card-border bg-transparent px-1.5 py-1 text-sm"
            />
          </label>
        </div>

        {!hydrated ? (
          <div className="h-64 animate-pulse rounded-xl border border-card-border bg-card" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-accent-tint text-xs">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Difficulty</th>
                  <th className="px-3 py-2">Pattern</th>
                  <th className="px-3 py-2">Starred</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-card-border">
                    <td className="px-3 py-2">
                      <Link href={`/day/${r.day}`} className="text-accent hover:underline">
                        {r.day}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <StatusControl status={r.status} disabled onCycle={() => {}} />
                    </td>
                    <td className="max-w-xs truncate px-3 py-2">
                      {r.isEmpty ? <span className="italic text-muted">empty — {r.id}</span> : r.title}
                    </td>
                    <td className="px-3 py-2">
                      <DifficultyTag difficulty={r.difficulty} />
                    </td>
                    <td className="px-3 py-2 text-muted">{r.pattern || "—"}</td>
                    <td className="px-3 py-2">
                      {r.starred && <Star size={14} className="text-amber-500" fill="currentColor" />}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted">
                      No matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
