"use client";

import { Circle, CheckCircle2, CircleDot, BadgeCheck } from "lucide-react";
import type { QuestionStatus } from "@/types";

const LABELS: Record<QuestionStatus, string> = {
  unsolved: "Unsolved",
  "solved-clean": "Solved clean",
  "solved-with-hint": "Solved with hint",
  "solved-with-editorial": "Solved with editorial",
};

const ICONS: Record<QuestionStatus, typeof Circle> = {
  unsolved: Circle,
  "solved-clean": CheckCircle2,
  "solved-with-hint": CircleDot,
  "solved-with-editorial": BadgeCheck,
};

const COLORS: Record<QuestionStatus, string> = {
  unsolved: "text-muted",
  "solved-clean": "text-emerald-600 dark:text-emerald-400",
  "solved-with-hint": "text-amber-600 dark:text-amber-400",
  "solved-with-editorial": "text-blue-600 dark:text-blue-400",
};

export function StatusControl({
  status,
  disabled,
  onCycle,
}: {
  status: QuestionStatus;
  disabled: boolean;
  onCycle: () => void;
}) {
  const Icon = ICONS[status];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCycle}
      aria-label={disabled ? "Slot is empty" : `Status: ${LABELS[status]}. Click to change.`}
      className={`shrink-0 rounded-full p-0.5 transition-transform enabled:hover:scale-110 enabled:active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${COLORS[status]}`}
    >
      <Icon size={22} strokeWidth={2} />
    </button>
  );
}
