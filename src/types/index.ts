export type Difficulty = "Easy" | "Medium" | "Hard" | "";

export interface QuestionLinks {
  primary: string;
  editorial: string;
  video: string;
}

export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  tags: string[];
  links: QuestionLinks;
}

export interface Day {
  day: number;
  topic: string;
  goal: string;
  questions: Question[];
}

export interface Plan {
  schemaVersion: number;
  title: string;
  startDate: string;
  questionsPerDay: number;
  days: Day[];
}

export type QuestionStatus =
  | "unsolved"
  | "solved-clean"
  | "solved-with-hint"
  | "solved-with-editorial";

export interface QuestionProgress {
  status: QuestionStatus;
  starred: boolean;
  attempts: number;
  lastSolvedAt: string | null;
  note: string;
  linkOverride: string | null;
  titleOverride: string | null;
  difficultyOverride: Difficulty | null;
  patternOverride: string | null;
}

export interface ProgressData {
  schemaVersion: number;
  updatedAt: string;
  questions: Record<string, QuestionProgress>;
  dayNotes: Record<string, string>;
  extraQuestions: Record<string, Question[]>;
  /** ISO date (first hydrate ever) — anchors the streak-freeze earn schedule. */
  trackerStartedAt: string;
  /** `YYYY-MM-DD` (local) -> true, written whenever cycleStatus/setDayNote/toggleStar fires. */
  activityLog: Record<string, true>;
  /** ISO dates (local `YYYY-MM-DD`) a streak freeze was auto-consumed to bridge a missed day. */
  streakFreezesUsedAt: string[];
  /** badge id -> ISO date first earned. */
  earnedBadges: Record<string, string>;
  /** Reminder email, set from Settings. Never written to plan.json / Git. */
  reminderEmail: string;
}
