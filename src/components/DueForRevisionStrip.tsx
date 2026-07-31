"use client";

import Link from "next/link";
import { useProgressStore } from "@/store/useProgressStore";
import { dueForRevision } from "@/lib/dueForRevision";

export function DueForRevisionStrip() {
  const progress = useProgressStore((s) => s.data);
  const due = dueForRevision(progress);

  if (due.length === 0) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">Due for revision</h2>
      <ul className="flex flex-col gap-1.5">
        {due.map((q) => (
          <li key={q.id}>
            <Link
              href={`/day/${q.day}`}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent-tint"
            >
              <span className="truncate">
                Day {q.day} · {q.title}
              </span>
              <span className="shrink-0 text-xs text-muted">{q.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
