import type { ProgressData } from "@/types";

export const PROGRESS_STORAGE_KEY = "dsa-tracker:progress:v1";
export const PROGRESS_SCHEMA_VERSION = 1;

export function emptyProgressData(): ProgressData {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    updatedAt: new Date(0).toISOString(),
    questions: {},
    dayNotes: {},
    extraQuestions: {},
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
    if (!raw) return emptyProgressData();

    try {
      const parsed = JSON.parse(raw) as ProgressData;
      if (parsed.schemaVersion !== PROGRESS_SCHEMA_VERSION) {
        console.warn(
          `dsa-30: progress schemaVersion mismatch (got ${parsed.schemaVersion}, expected ${PROGRESS_SCHEMA_VERSION}); falling back to empty state`
        );
        return emptyProgressData();
      }
      return {
        ...emptyProgressData(),
        ...parsed,
      };
    } catch (err) {
      console.warn("dsa-30: failed to parse stored progress, falling back to empty state", err);
      return emptyProgressData();
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
