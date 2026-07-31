import { create } from "zustand";
import type { Difficulty, ProgressData, Question, QuestionProgress, QuestionStatus } from "@/types";
import { LocalStorageStore, emptyProgressData, PROGRESS_SCHEMA_VERSION } from "@/lib/storage";
import { DEFAULT_QUESTION_PROGRESS } from "@/lib/merge";

const store = new LocalStorageStore();
const SAVE_DEBOUNCE_MS = 400;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Discrete actions (status click, star, slot edit) save immediately — losing
// a tick because the tab closed inside a debounce window would be a real bug.
// Only free-text notes, which fire on every keystroke, are debounced.
function saveNow(data: ProgressData) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  store.save({ ...data, updatedAt: new Date().toISOString() });
}

function scheduleSave(data: ProgressData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    store.save({ ...data, updatedAt: new Date().toISOString() });
  }, SAVE_DEBOUNCE_MS);
}

export function flushPendingSave(data: ProgressData) {
  if (saveTimer) saveNow(data);
}

const STATUS_CYCLE: QuestionStatus[] = [
  "unsolved",
  "solved-clean",
  "solved-with-hint",
  "solved-with-editorial",
];

function nextStatus(current: QuestionStatus): QuestionStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

interface ProgressStoreState {
  data: ProgressData;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  cycleStatus: (id: string) => void;
  toggleStar: (id: string) => void;
  setQuestionNote: (id: string, note: string) => void;
  setDayNote: (day: number, note: string) => void;
  setOverrides: (
    id: string,
    fields: Partial<
      Pick<QuestionProgress, "titleOverride" | "linkOverride" | "difficultyOverride" | "patternOverride">
    >
  ) => void;
  addExtraQuestion: (day: number) => string;
  updateExtraQuestion: (
    day: number,
    id: string,
    fields: Partial<Pick<Question, "title" | "difficulty" | "pattern">> & { url?: string }
  ) => void;
  replaceProgress: (data: ProgressData) => void;
}

function getOrDefaultQuestion(data: ProgressData, id: string): QuestionProgress {
  return data.questions[id] ?? { ...DEFAULT_QUESTION_PROGRESS };
}

export const useProgressStore = create<ProgressStoreState>((set, get) => ({
  data: emptyProgressData(),
  hydrated: false,

  hydrate: async () => {
    const loaded = await store.load();
    set({ data: loaded, hydrated: true });
  },

  cycleStatus: (id) => {
    set((state) => {
      const current = getOrDefaultQuestion(state.data, id);
      const status = nextStatus(current.status);
      const becameSolved = current.status === "unsolved" && status !== "unsolved";
      const updated: QuestionProgress = {
        ...current,
        status,
        attempts: becameSolved ? current.attempts + 1 : current.attempts,
        lastSolvedAt: becameSolved ? new Date().toISOString() : current.lastSolvedAt,
      };
      const data = {
        ...state.data,
        questions: { ...state.data.questions, [id]: updated },
      };
      saveNow(data);
      return { data };
    });
  },

  toggleStar: (id) => {
    set((state) => {
      const current = getOrDefaultQuestion(state.data, id);
      const updated: QuestionProgress = { ...current, starred: !current.starred };
      const data = {
        ...state.data,
        questions: { ...state.data.questions, [id]: updated },
      };
      saveNow(data);
      return { data };
    });
  },

  setQuestionNote: (id, note) => {
    set((state) => {
      const current = getOrDefaultQuestion(state.data, id);
      const updated: QuestionProgress = { ...current, note };
      const data = {
        ...state.data,
        questions: { ...state.data.questions, [id]: updated },
      };
      scheduleSave(data);
      return { data };
    });
  },

  setDayNote: (day, note) => {
    set((state) => {
      const data = {
        ...state.data,
        dayNotes: { ...state.data.dayNotes, [String(day)]: note },
      };
      scheduleSave(data);
      return { data };
    });
  },

  setOverrides: (id, fields) => {
    set((state) => {
      const current = getOrDefaultQuestion(state.data, id);
      const updated: QuestionProgress = { ...current, ...fields };
      const data = {
        ...state.data,
        questions: { ...state.data.questions, [id]: updated },
      };
      saveNow(data);
      return { data };
    });
  },

  addExtraQuestion: (day) => {
    const key = String(day);
    const state = get();
    const existing = state.data.extraQuestions[key] ?? [];
    let n = existing.length + 1;
    let id = `d${String(day).padStart(2, "0")}-c${String(n).padStart(2, "0")}`;
    const existingIds = new Set(existing.map((q) => q.id));
    while (existingIds.has(id)) {
      n += 1;
      id = `d${String(day).padStart(2, "0")}-c${String(n).padStart(2, "0")}`;
    }
    const newQuestion: Question = {
      id,
      title: "",
      difficulty: "",
      pattern: "",
      tags: [],
      links: { primary: "", editorial: "", video: "" },
    };
    set((s) => {
      const data = {
        ...s.data,
        extraQuestions: { ...s.data.extraQuestions, [key]: [...existing, newQuestion] },
      };
      saveNow(data);
      return { data };
    });
    return id;
  },

  updateExtraQuestion: (day, id, fields) => {
    set((state) => {
      const key = String(day);
      const list = state.data.extraQuestions[key] ?? [];
      const updatedList = list.map((q) =>
        q.id === id
          ? {
              ...q,
              ...(fields.title !== undefined ? { title: fields.title } : {}),
              ...(fields.difficulty !== undefined ? { difficulty: fields.difficulty as Difficulty } : {}),
              ...(fields.pattern !== undefined ? { pattern: fields.pattern } : {}),
              links: fields.url !== undefined ? { ...q.links, primary: fields.url } : q.links,
            }
          : q
      );
      const data = {
        ...state.data,
        extraQuestions: { ...state.data.extraQuestions, [key]: updatedList },
      };
      saveNow(data);
      return { data };
    });
  },

  replaceProgress: (data) => {
    const normalised: ProgressData = {
      ...emptyProgressData(),
      ...data,
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    };
    set({ data: normalised });
    store.save(normalised);
  },
}));
