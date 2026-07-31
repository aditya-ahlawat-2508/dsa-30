"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardPaste, HelpCircle } from "lucide-react";
import { getDay } from "@/lib/plan";
import { useHydrated } from "@/lib/useHydrated";
import { useProgressStore } from "@/store/useProgressStore";
import { displayedQuestionsForDay } from "@/lib/merge";
import { TopNav } from "@/components/TopNav";
import { DayNotes } from "@/components/DayNotes";
import { QuestionRow } from "@/components/QuestionRow";
import { SlotEditor, type SlotFormValues } from "@/components/SlotEditor";
import { PasteImporter } from "@/components/PasteImporter";
import { AddExtraQuestion } from "@/components/AddExtraQuestion";
import { ShortcutOverlay } from "@/components/ShortcutOverlay";
import { DaySkeleton } from "@/components/Skeleton";

export default function DayPage() {
  const params = useParams<{ day: string }>();
  const dayNumber = Number(params.day);
  const hydrated = useHydrated();

  const progress = useProgressStore((s) => s.data);
  const cycleStatus = useProgressStore((s) => s.cycleStatus);
  const toggleStar = useProgressStore((s) => s.toggleStar);
  const setOverrides = useProgressStore((s) => s.setOverrides);
  const addExtraQuestion = useProgressStore((s) => s.addExtraQuestion);
  const updateExtraQuestion = useProgressStore((s) => s.updateExtraQuestion);

  const day = getDay(dayNumber);
  const questions = useMemo(
    () => (day ? displayedQuestionsForDay(day, progress) : []),
    [day, progress]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Reset selection when navigating to a different day. Adjusting state during
  // render (rather than in an effect) avoids an extra render pass.
  const [selectionDay, setSelectionDay] = useState(dayNumber);
  if (selectionDay !== dayNumber) {
    setSelectionDay(dayNumber);
    setSelectedIndex(0);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;

      if (e.key === "?") {
        setShortcutsOpen((v) => !v);
        return;
      }
      if (isTyping || !questions.length) return;

      switch (e.key) {
        case "j":
          setSelectedIndex((i) => Math.min(i + 1, questions.length - 1));
          break;
        case "k":
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case " ": {
          e.preventDefault();
          const q = questions[selectedIndex];
          if (q && !q.isEmpty) cycleStatus(q.id);
          break;
        }
        case "s": {
          const q = questions[selectedIndex];
          if (q && !q.isEmpty) toggleStar(q.id);
          break;
        }
        case "e": {
          const q = questions[selectedIndex];
          if (q) setEditingId(q.id);
          break;
        }
        case "n": {
          e.preventDefault();
          const el = document.querySelector<HTMLTextAreaElement>("[data-day-notes]");
          el?.focus();
          break;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [questions, selectedIndex, cycleStatus, toggleStar]);

  if (!day) {
    return (
      <>
        <TopNav />
        <main className="mx-auto w-full max-w-2xl flex-1 p-4">
          <p className="text-sm text-muted">Day {params.day} does not exist (valid range: 1–30).</p>
        </main>
      </>
    );
  }

  const emptySlotIds = questions.filter((q) => !q.isExtra && q.isEmpty).map((q) => q.id);
  const allFixedFilled = questions.filter((q) => !q.isExtra).every((q) => !q.isEmpty);
  const editingQuestion = questions.find((q) => q.id === editingId) ?? null;

  function saveEdit(values: SlotFormValues) {
    if (!editingQuestion) return;
    if (editingQuestion.isExtra) {
      updateExtraQuestion(dayNumber, editingQuestion.id, {
        title: values.title,
        difficulty: values.difficulty,
        pattern: values.pattern,
        url: values.url,
      });
    } else {
      setOverrides(editingQuestion.id, {
        titleOverride: values.title,
        linkOverride: values.url,
        difficultyOverride: values.difficulty,
        patternOverride: values.pattern,
      });
    }
  }

  function applyPasteAssignments(assignments: { id: string; row: { title: string; difficulty: string; url: string; pattern: string } }[]) {
    for (const { id, row } of assignments) {
      setOverrides(id, {
        titleOverride: row.title,
        linkOverride: row.url,
        difficultyOverride: row.difficulty as SlotFormValues["difficulty"],
        patternOverride: row.pattern,
      });
    }
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        {!hydrated ? (
          <DaySkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
                <ArrowLeft size={15} /> All days
              </Link>
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                aria-label="Show keyboard shortcuts"
                className="rounded-full p-1.5 text-muted hover:bg-accent-tint"
              >
                <HelpCircle size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Day {String(day.day).padStart(2, "0")}</h1>
                {day.topic && <p className="text-sm text-muted">{day.topic}</p>}
                {day.goal && <p className="text-xs text-muted">{day.goal}</p>}
              </div>
              {emptySlotIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPasteOpen(true)}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:bg-accent-tint"
                >
                  <ClipboardPaste size={14} /> Paste questions
                </button>
              )}
            </div>

            <ul className="flex flex-col gap-2">
              {questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  slotNumber={i + 1}
                  selected={i === selectedIndex}
                  onEdit={() => setEditingId(q.id)}
                />
              ))}
            </ul>

            {allFixedFilled && <AddExtraQuestion onAdd={() => addExtraQuestion(dayNumber)} />}

            <DayNotes key={dayNumber} day={dayNumber} />
          </>
        )}
      </main>

      {editingQuestion && (
        <SlotEditor
          slotLabel={editingQuestion.id}
          initial={{
            title: editingQuestion.title,
            difficulty: editingQuestion.difficulty,
            url: editingQuestion.url,
            pattern: editingQuestion.pattern,
          }}
          onClose={() => setEditingId(null)}
          onSave={saveEdit}
        />
      )}

      {pasteOpen && (
        <PasteImporter
          emptySlotIds={emptySlotIds}
          onClose={() => setPasteOpen(false)}
          onConfirm={applyPasteAssignments}
        />
      )}

      {shortcutsOpen && <ShortcutOverlay onClose={() => setShortcutsOpen(false)} />}
    </>
  );
}
