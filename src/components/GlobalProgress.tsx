"use client";

import { Flame } from "lucide-react";
import { plan } from "@/lib/plan";
import { useProgressStore } from "@/store/useProgressStore";
import { displayedQuestionsForDay, isSolvedStatus } from "@/lib/merge";
import { currentStreak } from "@/lib/streak";
import { ProgressBar } from "./ProgressBar";

export function GlobalProgress() {
  const progress = useProgressStore((s) => s.data);

  let solved = 0;
  let planned = 0;
  let total = 0;
  for (const day of plan.days) {
    const questions = displayedQuestionsForDay(day, progress);
    total += questions.length;
    for (const q of questions) {
      if (!q.isEmpty) planned += 1;
      if (!q.isEmpty && isSolvedStatus(q.status)) solved += 1;
    }
  }

  const streak = currentStreak(progress);

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{solved}</span>
          <span className="text-sm text-muted">/ {total} solved</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{planned} / {total} planned</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Flame size={14} /> {streak} day streak
            </span>
          )}
        </div>
      </div>
      <ProgressBar solved={solved} total={total} />
    </div>
  );
}
