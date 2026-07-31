"use client";

import { Star } from "lucide-react";

export function StarButton({
  starred,
  disabled,
  onToggle,
}: {
  starred: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={disabled ? "Slot is empty" : starred ? "Starred, click to unstar" : "Not starred, click to star"}
      className="shrink-0 rounded-full p-0.5 text-amber-500 transition-transform enabled:hover:scale-110 enabled:active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Star size={20} strokeWidth={2} fill={starred ? "currentColor" : "none"} />
    </button>
  );
}
