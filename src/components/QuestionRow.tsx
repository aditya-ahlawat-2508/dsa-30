"use client";

import { useState } from "react";
import { MessageSquareText, Pencil } from "lucide-react";
import type { DisplayedQuestion } from "@/lib/merge";
import { useProgressStore } from "@/store/useProgressStore";
import { StatusControl } from "./StatusControl";
import { StarButton } from "./StarButton";
import { DifficultyTag } from "./DifficultyTag";
import { LinkIcons } from "./LinkIcons";

export function QuestionRow({
  q,
  slotNumber,
  selected,
  onEdit,
}: {
  q: DisplayedQuestion;
  slotNumber: number;
  selected?: boolean;
  onEdit: () => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const cycleStatus = useProgressStore((s) => s.cycleStatus);
  const toggleStar = useProgressStore((s) => s.toggleStar);
  const setQuestionNote = useProgressStore((s) => s.setQuestionNote);

  if (q.isEmpty) {
    return (
      <li
        data-row
        className={`flex items-center gap-3 rounded-lg border border-dashed border-card-border px-3 py-3 text-muted ${
          selected ? "ring-2 ring-accent" : ""
        }`}
      >
        <StatusControl status="unsolved" disabled onCycle={() => {}} />
        <span className="flex-1 text-sm italic">Slot {slotNumber} — empty</span>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-md border border-card-border px-2 py-1 text-xs font-medium hover:bg-accent-tint"
        >
          <Pencil size={13} /> Add
        </button>
      </li>
    );
  }

  return (
    <li
      data-row
      className={`flex flex-col gap-2 rounded-lg border border-card-border bg-card px-3 py-2.5 ${
        selected ? "ring-2 ring-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <StatusControl status={q.status} disabled={false} onCycle={() => cycleStatus(q.id)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{q.title}</p>
          {q.pattern && (
            <span className="mt-0.5 inline-block rounded-full bg-accent-tint px-2 py-0.5 text-[11px] text-accent">
              {q.pattern}
            </span>
          )}
        </div>
        <DifficultyTag difficulty={q.difficulty} />
        <LinkIcons primary={q.url} editorial={q.editorialUrl} video={q.videoUrl} />
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit slot"
          className="shrink-0 rounded-full p-1.5 text-muted hover:bg-accent-tint hover:text-accent"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => setNoteOpen((v) => !v)}
          aria-label={noteOpen ? "Hide note" : "Show note"}
          aria-expanded={noteOpen}
          className={`shrink-0 rounded-full p-1.5 hover:bg-accent-tint ${
            q.note ? "text-accent" : "text-muted"
          }`}
        >
          <MessageSquareText size={16} />
        </button>
        <StarButton starred={q.starred} disabled={false} onToggle={() => toggleStar(q.id)} />
      </div>
      {noteOpen && (
        <input
          type="text"
          value={q.note}
          onChange={(e) => setQuestionNote(q.id, e.target.value)}
          placeholder="One-line note…"
          className="ml-9 rounded-md border border-card-border bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
        />
      )}
    </li>
  );
}
