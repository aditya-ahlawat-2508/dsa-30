"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";

/**
 * Render with `key={day}` from the parent so navigating to a different day
 * remounts this component and re-reads `stored` fresh, instead of syncing
 * via an effect.
 */
export function DayNotes({ day }: { day: number }) {
  const stored = useProgressStore((s) => s.data.dayNotes[String(day)] ?? "");
  const setDayNote = useProgressStore((s) => s.setDayNote);
  const [value, setValue] = useState(stored);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);
    setSaved(false);
    setDayNote(day, next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(true), 450);
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Concept notes</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">{saved ? "Saved" : "Saving…"}</span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            aria-label={preview ? "Switch to edit mode" : "Switch to preview mode"}
            className="flex items-center gap-1 rounded-md border border-card-border px-2 py-1 text-xs hover:bg-accent-tint"
          >
            {preview ? <Pencil size={13} /> : <Eye size={13} />}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
      </div>
      {preview ? (
        <div className="prose prose-sm dark:prose-invert min-h-[8rem] max-w-none rounded-md border border-card-border px-3 py-2">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="italic text-muted">Nothing written yet.</p>
          )}
        </div>
      ) : (
        <textarea
          data-day-notes
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          placeholder="## Concept notes for this day…"
          className="w-full resize-y rounded-md border border-card-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
      )}
    </div>
  );
}
