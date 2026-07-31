"use client";

import { Plus } from "lucide-react";

export function AddExtraQuestion({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-card-border px-3 py-2.5 text-sm text-muted hover:border-accent hover:text-accent"
    >
      <Plus size={15} /> Add extra question
    </button>
  );
}
