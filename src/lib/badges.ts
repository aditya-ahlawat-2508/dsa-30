import type { ProgressData } from "@/types";
import { plan } from "./plan";
import { displayedQuestionsForDay, isSolvedStatus } from "./merge";
import { currentStreak } from "./streak";
import { bucketForPattern } from "./topicBuckets";

export interface Badge {
  id: string;
  name: string;
  description: string;
  check: (progress: ProgressData) => boolean;
}

function solvedQuestions(progress: ProgressData) {
  const solved: { pattern: string }[] = [];
  for (const day of plan.days) {
    for (const q of displayedQuestionsForDay(day, progress)) {
      if (!q.isEmpty && isSolvedStatus(q.status)) solved.push({ pattern: q.pattern });
    }
  }
  return solved;
}

// Streak milestones are the primary ask; the rest are deliberately minimal
// extras so this doesn't sprawl into a full achievements system.
export const BADGES: Badge[] = [
  {
    id: "streak-7",
    name: "7-Day Streak",
    description: "Stay active 7 days in a row.",
    check: (p) => currentStreak(p) >= 7,
  },
  {
    id: "streak-30",
    name: "30-Day Streak",
    description: "Stay active 30 days in a row.",
    check: (p) => currentStreak(p) >= 30,
  },
  {
    id: "streak-100",
    name: "100-Day Streak",
    description: "Stay active 100 days in a row.",
    check: (p) => currentStreak(p) >= 100,
  },
  {
    id: "first-solve",
    name: "First Solve",
    description: "Solve your first question.",
    check: (p) => solvedQuestions(p).length >= 1,
  },
  {
    id: "ten-solved",
    name: "10 Questions Solved",
    description: "Solve 10 questions.",
    check: (p) => solvedQuestions(p).length >= 10,
  },
  {
    id: "first-dp",
    name: "First DP Solve",
    description: "Solve your first DP question.",
    check: (p) => solvedQuestions(p).some((q) => bucketForPattern(q.pattern) === "DP"),
  },
  {
    id: "all-days-planned",
    name: "All Days Planned",
    description: "Every one of the 30 days has at least one question planned.",
    check: (p) => plan.days.every((day) => displayedQuestionsForDay(day, p).some((q) => !q.isEmpty)),
  },
];

/** Badges that newly qualify and aren't already in earnedBadges — call after cycleStatus/streak recompute. */
export function evaluateNewBadges(progress: ProgressData): Badge[] {
  const earned = progress.earnedBadges ?? {};
  return BADGES.filter((b) => !(b.id in earned) && b.check(progress));
}
