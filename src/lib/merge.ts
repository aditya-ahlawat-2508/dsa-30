import type { Day, ProgressData, Question, QuestionProgress, QuestionStatus, Difficulty } from "@/types";

export const DEFAULT_QUESTION_PROGRESS: QuestionProgress = {
  status: "unsolved",
  starred: false,
  attempts: 0,
  lastSolvedAt: null,
  note: "",
  linkOverride: null,
  titleOverride: null,
  difficultyOverride: null,
  patternOverride: null,
};

export interface DisplayedQuestion {
  id: string;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  tags: string[];
  url: string;
  editorialUrl: string;
  videoUrl: string;
  isEmpty: boolean;
  isExtra: boolean;
  status: QuestionStatus;
  starred: boolean;
  attempts: number;
  lastSolvedAt: string | null;
  note: string;
}

export function mergeQuestion(
  q: Question,
  progress: ProgressData,
  isExtra = false
): DisplayedQuestion {
  const p = progress.questions[q.id] ?? DEFAULT_QUESTION_PROGRESS;
  const title = p.titleOverride ?? q.title;
  return {
    id: q.id,
    title,
    difficulty: p.difficultyOverride ?? q.difficulty,
    pattern: p.patternOverride ?? q.pattern,
    tags: q.tags,
    url: p.linkOverride ?? q.links.primary,
    editorialUrl: q.links.editorial,
    videoUrl: q.links.video,
    isEmpty: title === "",
    isExtra,
    status: p.status,
    starred: p.starred,
    attempts: p.attempts,
    lastSolvedAt: p.lastSolvedAt,
    note: p.note,
  };
}

export function displayedQuestionsForDay(day: Day, progress: ProgressData): DisplayedQuestion[] {
  const extras = progress.extraQuestions[String(day.day)] ?? [];
  return [
    ...day.questions.map((q) => mergeQuestion(q, progress, false)),
    ...extras.map((q) => mergeQuestion(q, progress, true)),
  ];
}

export function isSolvedStatus(status: QuestionStatus): boolean {
  return status !== "unsolved";
}
