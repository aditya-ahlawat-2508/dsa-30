"use client";

import { useRef, useState } from "react";
import { Download, Upload, Send } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";
import { useProgressStore } from "@/store/useProgressStore";
import { buildMergedPlanExport, buildIntakeCsv, triggerDownload, summarise } from "@/lib/exportImport";
import { TopNav } from "@/components/TopNav";
import { Modal } from "@/components/Modal";
import type { ProgressData } from "@/types";

type ReminderSendState = "idle" | "sending" | "sent" | "skipped" | "error";

export default function SettingsPage() {
  const hydrated = useHydrated();
  const progress = useProgressStore((s) => s.data);
  const replaceProgress = useProgressStore((s) => s.replaceProgress);
  const setReminderEmail = useProgressStore((s) => s.setReminderEmail);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ProgressData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [reminderState, setReminderState] = useState<ReminderSendState>("idle");
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  async function sendTestReminder() {
    if (!progress.reminderEmail) {
      setReminderState("error");
      setReminderMessage("Enter an email address first.");
      return;
    }
    setReminderState("sending");
    setReminderMessage(null);
    try {
      // Always force-send for the test button — hasSolvedToday is what the
      // real cron would pass, but a manual test should verify the pipeline
      // works regardless of today's activity.
      const res = await fetch("/api/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: progress.reminderEmail, hasSolvedToday: false }),
      });
      const json = await res.json();
      if (!res.ok) {
        setReminderState("error");
        setReminderMessage(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setReminderState("sent");
      setReminderMessage("Test email sent.");
    } catch {
      setReminderState("error");
      setReminderMessage("Could not reach /api/reminder.");
    }
  }

  function exportPlan() {
    const merged = buildMergedPlanExport(progress);
    triggerDownload("plan.json", JSON.stringify(merged, null, 2), "application/json");
  }

  function exportCsv() {
    triggerDownload("intake.csv", buildIntakeCsv(progress), "text/csv");
  }

  function exportProgress() {
    triggerDownload("progress.json", JSON.stringify(progress, null, 2), "application/json");
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    file
      .text()
      .then((text) => {
        try {
          const parsed = JSON.parse(text) as ProgressData;
          if (typeof parsed !== "object" || parsed === null || !("questions" in parsed)) {
            setImportError("File doesn't look like a progress.json export.");
            return;
          }
          setPendingImport(parsed);
        } catch {
          setImportError("Could not parse that file as JSON.");
        }
      })
      .catch(() => setImportError("Could not read that file."));
  }

  function confirmImport() {
    if (pendingImport) replaceProgress(pendingImport);
    setPendingImport(null);
  }

  const currentSummary = summarise(progress);
  const pendingSummary = pendingImport ? summarise(pendingImport) : null;

  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-bold">Settings</h1>

        {!hydrated ? (
          <div className="h-48 animate-pulse rounded-xl border border-card-border bg-card" />
        ) : (
          <>
            <section className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-4">
              <h2 className="text-sm font-semibold">Export</h2>
              <p className="text-xs text-muted">
                localStorage is one &quot;Clear browsing data&quot; away from gone. Export regularly, or after
                filling slots on your phone, to bring changes back into Git.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportPlan}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
                >
                  <Download size={14} /> plan.json
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
                >
                  <Download size={14} /> intake.csv
                </button>
                <button
                  type="button"
                  onClick={exportProgress}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
                >
                  <Download size={14} /> progress.json
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-4">
              <h2 className="text-sm font-semibold">Import progress.json</h2>
              <p className="text-xs text-muted">
                Replaces all current ticks, stars, notes and overrides. You&apos;ll see a summary and
                confirm before anything is overwritten.
              </p>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={onFileChosen}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
                >
                  <Upload size={14} /> Choose file
                </button>
              </div>
              {importError && <p className="text-xs text-rose-600 dark:text-rose-400">{importError}</p>}
            </section>

            <section className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-4">
              <h2 className="text-sm font-semibold">Email reminders</h2>
              <p className="text-xs text-muted">
                A daily nudge if you haven&apos;t solved anything yet. Sending needs a small
                server-side piece (a Resend API key and, for the daily cron, a Vercel deployment)
                — see the README for setup. This address is stored only in this browser&apos;s
                localStorage, never in Git.
              </p>
              <label className="flex flex-col gap-1 text-sm">
                Reminder email
                <input
                  type="email"
                  value={progress.reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-md border border-card-border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendTestReminder}
                  disabled={reminderState === "sending"}
                  className="flex items-center gap-1.5 rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint disabled:opacity-50"
                >
                  <Send size={14} /> {reminderState === "sending" ? "Sending…" : "Send test email"}
                </button>
                {reminderMessage && (
                  <span
                    className={`text-xs ${
                      reminderState === "error" ? "text-rose-600 dark:text-rose-400" : "text-muted"
                    }`}
                  >
                    {reminderMessage}
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-card-border bg-card p-4 text-xs text-muted">
              Currently stored: {currentSummary.questionCount} question record(s), {currentSummary.dayNoteCount}{" "}
              day note(s), {currentSummary.extraCount} extra question(s).
            </section>
          </>
        )}
      </main>

      {pendingSummary && (
        <Modal title="Confirm import" onClose={() => setPendingImport(null)}>
          <p className="mb-3 text-sm">This will overwrite your current progress:</p>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-card-border p-2">
              <p className="mb-1 font-semibold text-muted">Current</p>
              <p>{currentSummary.questionCount} questions</p>
              <p>{currentSummary.dayNoteCount} day notes</p>
              <p>{currentSummary.extraCount} extras</p>
            </div>
            <div className="rounded-md border border-accent p-2">
              <p className="mb-1 font-semibold text-accent">Incoming</p>
              <p>{pendingSummary.questionCount} questions</p>
              <p>{pendingSummary.dayNoteCount} day notes</p>
              <p>{pendingSummary.extraCount} extras</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              className="rounded-md border border-card-border px-3 py-1.5 text-sm hover:bg-accent-tint"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Overwrite and import
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
