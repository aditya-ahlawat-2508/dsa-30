import { plan } from "./plan";
import { mergeQuestion } from "./merge";
import type { ProgressData, Plan, ProgressData as ProgressDataType } from "@/types";

function toCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsvRow(values: string[]): string {
  return values.map(toCsvField).join(",");
}

export function buildMergedPlanExport(progress: ProgressData): Plan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      questions: [
        ...day.questions.map((q) => {
          const merged = mergeQuestion(q, progress, false);
          return {
            id: q.id,
            title: merged.title,
            difficulty: merged.difficulty,
            pattern: merged.pattern,
            tags: q.tags,
            links: { primary: merged.url, editorial: merged.editorialUrl, video: merged.videoUrl },
          };
        }),
        ...(progress.extraQuestions[String(day.day)] ?? []),
      ],
    })),
  };
}

export function buildIntakeCsv(progress: ProgressData): string {
  const rows = [["day", "slot", "title", "difficulty", "url", "pattern"]];
  for (const day of plan.days) {
    day.questions.forEach((q, i) => {
      const merged = mergeQuestion(q, progress, false);
      rows.push([String(day.day), String(i + 1), merged.title, merged.difficulty, merged.url, merged.pattern]);
    });
  }
  return rows.map(toCsvRow).join("\n") + "\n";
}

export function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ImportSummary {
  questionCount: number;
  dayNoteCount: number;
  extraCount: number;
  updatedAt: string;
}

export function summarise(data: ProgressDataType): ImportSummary {
  return {
    questionCount: Object.keys(data.questions).length,
    dayNoteCount: Object.keys(data.dayNotes).length,
    extraCount: Object.values(data.extraQuestions).reduce((sum, arr) => sum + arr.length, 0),
    updatedAt: data.updatedAt,
  };
}
