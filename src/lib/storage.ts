import type { ProgressData } from "@/types";

export const PROGRESS_STORAGE_KEY = "dsa-tracker:progress:v1";
// Bumped once for the streak/freeze/badge/reminder fields added together —
// see CLAUDE.md and the migration note in load() below.
export const PROGRESS_SCHEMA_VERSION = 2;

export function emptyProgressData(): ProgressData {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    updatedAt: new Date(0).toISOString(),
    questions: {},
    dayNotes: {},
    extraQuestions: {},
    trackerStartedAt: new Date().toISOString(),
    activityLog: {},
    streakFreezesUsedAt: [],
    earnedBadges: {},
    reminderEmail: "",
  };
}

export interface ProgressStore {
  load(): Promise<ProgressData>;
  save(data: ProgressData): Promise<void>;
}

export class LocalStorageStore implements ProgressStore {
  async load(): Promise<ProgressData> {
    if (typeof window === "undefined") return emptyProgressData();

    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      // Brand new user: stamp trackerStartedAt now and persist immediately so
      // it doesn't drift to "now" again on every load before the first save.
      const fresh = emptyProgressData();
      await this.save(fresh);
      return fresh;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProgressData> & { schemaVersion?: number };
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("stored progress is not an object");
      }

      // All schema changes so far are additive (new fields with safe
      // defaults) — migrate in place by merging with emptyProgressData()
      // rather than wiping existing ticks/stars/notes on a version bump.
      // A future non-additive change needs its own per-version migration
      // step here instead of this blanket merge.
      const needsMigration = parsed.schemaVersion !== PROGRESS_SCHEMA_VERSION;
      const merged: ProgressData = {
        ...emptyProgressData(),
        ...parsed,
        schemaVersion: PROGRESS_SCHEMA_VERSION,
      };

      if (needsMigration) {
        console.warn(
          `dsa-30: migrated progress from schemaVersion ${parsed.schemaVersion} to ${PROGRESS_SCHEMA_VERSION}`
        );
        await this.save(merged);
      }

      return merged;
    } catch (err) {
      console.warn("dsa-30: failed to parse stored progress, falling back to empty state", err);
      const fresh = emptyProgressData();
      await this.save(fresh);
      return fresh;
    }
  }

  async save(data: ProgressData): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("dsa-30: failed to save progress", err);
    }
  }
}
