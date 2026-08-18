import type { ProgressData } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const FREEZE_PERIOD_DAYS = 30;

/** Local (not UTC) calendar date key, `YYYY-MM-DD` — streaks/freezes/heatmap all key off this. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Every local calendar date with either an activityLog entry or a question
 * solved that day (via lastSolvedAt) — the union covers progress saved
 * before activityLog existed, so upgrading doesn't reset anyone's streak.
 */
export function activeDateSet(progress: ProgressData): Set<string> {
  const dates = new Set<string>(Object.keys(progress.activityLog ?? {}));
  for (const q of Object.values(progress.questions)) {
    if (q.lastSolvedAt) dates.add(localDateKey(new Date(q.lastSolvedAt)));
  }
  return dates;
}

/** Count of questions whose lastSolvedAt falls on each local date — for heatmap shading. */
export function dailySolveCounts(progress: ProgressData): Map<string, number> {
  const counts = new Map<string, number>();
  for (const q of Object.values(progress.questions)) {
    if (!q.lastSolvedAt) continue;
    const key = localDateKey(new Date(q.lastSolvedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Marks today as active. Called from cycleStatus/setDayNote/toggleStar.
 * No-ops (returns the same reference) if today is already marked, so callers
 * on a hot path (every keystroke in notes) don't churn a new object each time.
 */
export function markActive(data: ProgressData, now: Date = new Date()): ProgressData {
  const key = localDateKey(now);
  if (data.activityLog[key]) return data;
  return { ...data, activityLog: { ...data.activityLog, [key]: true } };
}

/**
 * Consecutive active days ending today (or yesterday, if today isn't done
 * yet) — a date bridged by a streak freeze counts as active too.
 */
export function currentStreak(progress: ProgressData, now: Date = new Date()): number {
  const active = activeDateSet(progress);
  const frozen = new Set(progress.streakFreezesUsedAt ?? []);

  let streak = 0;
  let cursor = startOfDay(now);
  let key = localDateKey(cursor);

  if (!active.has(key) && !frozen.has(key)) {
    cursor = addDays(cursor, -1);
    key = localDateKey(cursor);
  }

  while (active.has(key) || frozen.has(key)) {
    streak += 1;
    cursor = addDays(cursor, -1);
    key = localDateKey(cursor);
  }

  return streak;
}

/** 1 freeze granted per rolling 30-day period since the tracker was first opened. */
export function freezesEarned(progress: ProgressData, now: Date = new Date()): number {
  if (!progress.trackerStartedAt) return 1;
  const start = new Date(progress.trackerStartedAt);
  const elapsedDays = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  if (elapsedDays < 0 || Number.isNaN(elapsedDays)) return 1;
  return Math.floor(elapsedDays / FREEZE_PERIOD_DAYS) + 1;
}

/** Earned so far minus already-consumed — never persisted directly, always derived. */
export function freezesAvailable(progress: ProgressData, now: Date = new Date()): number {
  const used = progress.streakFreezesUsedAt?.length ?? 0;
  return Math.max(0, freezesEarned(progress, now) - used);
}

export interface StreakFreezeCheckResult {
  usedForDate: string | null;
  freezesLeft: number;
}

/**
 * Run once per app open (from the store's hydrate action). If yesterday was
 * missed but the day before that was active (or itself freeze-bridged) and a
 * freeze is available, auto-consume one to keep the streak alive and report
 * it so the UI can toast. Only ever looks at "yesterday" relative to now —
 * a multi-day gap still breaks the streak past the single bridged day, which
 * is correct: a freeze covers one missed day, not an extended absence.
 */
export function checkAndApplyStreakFreeze(
  progress: ProgressData,
  now: Date = new Date()
): { data: ProgressData; result: StreakFreezeCheckResult } {
  const active = activeDateSet(progress);
  const yesterdayKey = localDateKey(addDays(startOfDay(now), -1));
  const dayBeforeKey = localDateKey(addDays(startOfDay(now), -2));
  const alreadyFrozen = new Set(progress.streakFreezesUsedAt ?? []);

  const noOp = (): { data: ProgressData; result: StreakFreezeCheckResult } => ({
    data: progress,
    result: { usedForDate: null, freezesLeft: freezesAvailable(progress, now) },
  });

  if (active.size === 0) return noOp();
  if (active.has(yesterdayKey) || alreadyFrozen.has(yesterdayKey)) return noOp();

  const hadStreakGoingIn = active.has(dayBeforeKey) || alreadyFrozen.has(dayBeforeKey);
  if (!hadStreakGoingIn) return noOp();

  const available = freezesAvailable(progress, now);
  if (available <= 0) return noOp();

  const data: ProgressData = {
    ...progress,
    streakFreezesUsedAt: [...progress.streakFreezesUsedAt, yesterdayKey],
  };
  return { data, result: { usedForDate: yesterdayKey, freezesLeft: available - 1 } };
}
