import { plan } from "./plan";
import { displayedQuestionsForDay, type DisplayedQuestion } from "./merge";
import type { ProgressData } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export interface DueQuestion extends DisplayedQuestion {
  day: number;
  reason: string;
}

export function dueForRevision(progress: ProgressData): DueQuestion[] {
  const due: DueQuestion[] = [];

  for (const day of plan.days) {
    const questions = displayedQuestionsForDay(day, progress);
    for (const q of questions) {
      if (q.isEmpty || !q.lastSolvedAt) continue;
      const age = daysAgo(q.lastSolvedAt);

      if (age === 7 || age === 21) {
        due.push({ ...q, day: day.day, reason: `solved ${age} days ago` });
      } else if (q.status === "solved-with-editorial" && age > 3) {
        due.push({ ...q, day: day.day, reason: "solved with editorial, 3+ days ago" });
      }
    }
  }

  return due;
}
