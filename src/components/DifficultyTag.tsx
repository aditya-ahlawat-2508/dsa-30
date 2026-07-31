import type { Difficulty } from "@/types";

const STYLES: Record<Exclude<Difficulty, "">, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  Hard: "text-rose-600 dark:text-rose-400",
};

export function DifficultyTag({ difficulty }: { difficulty: Difficulty }) {
  if (difficulty === "") {
    return <span className="text-xs text-muted">—</span>;
  }
  return <span className={`text-xs font-semibold ${STYLES[difficulty]}`}>{difficulty}</span>;
}
