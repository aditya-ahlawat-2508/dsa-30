"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/store/useProgressStore";
import { dailySolveCounts, activeDateSet, localDateKey } from "@/lib/streak";

const WEEKS = 15; // ~105 days, GitHub-style
const TOTAL_DAYS = WEEKS * 7;

interface Cell {
  key: string;
  count: number;
  active: boolean;
  inFuture: boolean;
}

// Shaded with the app's own accent token (not an arbitrary green) at
// increasing opacity — 0 solves/inactive, 0 solves/active (note or star
// only), 1, 2-3, 4+.
function tierClass(cell: Cell): string {
  if (cell.count >= 4) return "bg-accent";
  if (cell.count >= 2) return "bg-accent/60";
  if (cell.count >= 1) return "bg-accent/35";
  if (cell.active) return "bg-accent/15";
  return "bg-card-border/60";
}

export function StreakHeatmap() {
  const progress = useProgressStore((s) => s.data);

  const cells: Cell[] = useMemo(() => {
    const counts = dailySolveCounts(progress);
    const active = activeDateSet(progress);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align the grid to end on the upcoming Saturday so every column is a full week.
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const start = new Date(end);
    start.setDate(start.getDate() - (TOTAL_DAYS - 1));

    const list: Cell[] = [];
    const cursor = new Date(start);
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const key = localDateKey(cursor);
      list.push({
        key,
        count: counts.get(key) ?? 0,
        active: active.has(key),
        inFuture: cursor.getTime() > today.getTime(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }, [progress]);

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">Activity</h2>
      <div className="overflow-x-auto">
        <div
          className="grid w-max gap-1"
          style={{ gridTemplateRows: "repeat(7, 0.75rem)", gridAutoFlow: "column", gridAutoColumns: "0.75rem" }}
        >
          {cells.map((cell) =>
            cell.inFuture ? (
              <div key={cell.key} className="size-3 rounded-sm" />
            ) : (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.count} solved${cell.count === 0 && cell.active ? " (activity)" : ""}`}
                className={`size-3 rounded-sm transition-colors hover:outline hover:outline-1 hover:outline-accent ${tierClass(cell)}`}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
