import type { ProgressData } from "@/types";

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function currentStreak(progress: ProgressData): number {
  const solvedDates = new Set<string>();
  for (const q of Object.values(progress.questions)) {
    if (q.lastSolvedAt) solvedDates.add(dateKey(q.lastSolvedAt));
  }
  if (solvedDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Today doesn't have to be solved yet to keep yesterday's streak alive.
  if (!solvedDates.has(dateKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (solvedDates.has(dateKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
