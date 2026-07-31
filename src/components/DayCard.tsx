"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Day } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { displayedQuestionsForDay, isSolvedStatus } from "@/lib/merge";
import { ProgressBar } from "./ProgressBar";

export function DayCard({ day }: { day: Day }) {
  const progress = useProgressStore((s) => s.data);
  const questions = displayedQuestionsForDay(day, progress);
  const planned = questions.filter((q) => !q.isEmpty).length;
  const solved = questions.filter((q) => !q.isEmpty && isSolvedStatus(q.status)).length;
  const total = questions.length;
  const notPlanned = planned === 0;
  const fullySolved = planned > 0 && solved === planned;

  return (
    <Link
      href={`/day/${day.day}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-card-border bg-card transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        notPlanned ? "opacity-60" : ""
      }`}
    >
      <ProgressBar solved={solved} total={total} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between">
          <span className="text-2xl font-bold tabular-nums">{String(day.day).padStart(2, "0")}</span>
          {fullySolved && (
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" aria-label="Day fully solved" />
          )}
        </div>
        <span className="min-h-[1.25rem] truncate text-sm text-muted">{day.topic || (notPlanned ? "Not planned yet" : "")}</span>
        <span className="mt-auto pt-2 text-xs font-medium text-muted">
          {solved} / {total} solved
        </span>
      </div>
    </Link>
  );
}
