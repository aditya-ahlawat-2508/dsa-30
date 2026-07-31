"use client";

import { useState } from "react";
import type { Difficulty } from "@/types";
import { Modal } from "./Modal";

export interface SlotFormValues {
  title: string;
  difficulty: Difficulty;
  url: string;
  pattern: string;
}

export function SlotEditor({
  slotLabel,
  initial,
  onClose,
  onSave,
}: {
  slotLabel: string;
  initial: SlotFormValues;
  onClose: () => void;
  onSave: (values: SlotFormValues) => void;
}) {
  const [values, setValues] = useState<SlotFormValues>(initial);

  function submit() {
    onSave(values);
    onClose();
  }

  return (
    <Modal title={`Edit ${slotLabel}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Title
          <input
            type="text"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          URL
          <input
            type="text"
            value={values.url}
            onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))}
            placeholder="https://leetcode.com/problems/…"
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Difficulty
          <select
            value={values.difficulty}
            onChange={(e) => setValues((v) => ({ ...v, difficulty: e.target.value as Difficulty }))}
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="">—</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Pattern
          <input
            type="text"
            value={values.pattern}
            onChange={(e) => setValues((v) => ({ ...v, pattern: e.target.value }))}
            placeholder="monotonic stack, two pointers…"
            className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
