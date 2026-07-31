"use client";

import { useState } from "react";
import { parsePasteText, type ParsedPasteRow } from "@/lib/pasteParser";
import { Modal } from "./Modal";

export function PasteImporter({
  emptySlotIds,
  onClose,
  onConfirm,
}: {
  emptySlotIds: string[];
  onClose: () => void;
  onConfirm: (assignments: { id: string; row: ParsedPasteRow }[]) => void;
}) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedPasteRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function preview() {
    const result = parsePasteText(text, emptySlotIds.length);
    if (result.error) {
      setError(result.error);
      setRows(null);
      return;
    }
    setError(null);
    setRows(result.rows);
  }

  function confirm() {
    if (!rows) return;
    onConfirm(rows.map((row, i) => ({ id: emptySlotIds[i], row })));
    onClose();
  }

  return (
    <Modal title="Paste questions" onClose={onClose}>
      <p className="mb-2 text-xs text-muted">
        One question per line, filling the {emptySlotIds.length} empty slot(s) remaining, in order.
        Format: <code>url | difficulty | pattern</code> or <code>title | difficulty | pattern | url</code>{" "}
        — any order, split on <code>|</code>.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setRows(null);
          setError(null);
        }}
        rows={6}
        placeholder="https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/3sum/ | Medium | two pointers"
        className="w-full rounded-md border border-card-border bg-transparent px-2 py-1.5 font-mono text-xs outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={preview}
          className="rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
        >
          Preview
        </button>
      </div>
      {rows && rows.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted">Preview — nothing is written until you confirm:</p>
          <div className="overflow-x-auto rounded-md border border-card-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent-tint">
                <tr>
                  <th className="px-2 py-1.5">Slot</th>
                  <th className="px-2 py-1.5">Title</th>
                  <th className="px-2 py-1.5">Difficulty</th>
                  <th className="px-2 py-1.5">Pattern</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-card-border">
                    <td className="px-2 py-1.5 font-mono">{emptySlotIds[i]}</td>
                    <td className="px-2 py-1.5">{row.title || <span className="italic text-muted">blank</span>}</td>
                    <td className="px-2 py-1.5">{row.difficulty || "—"}</td>
                    <td className="px-2 py-1.5">{row.pattern || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={confirm}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Fill {rows.length} slot{rows.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
