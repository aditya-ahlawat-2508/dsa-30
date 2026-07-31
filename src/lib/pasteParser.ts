import { deriveTitleFromUrl } from "./deriveTitle";
import type { Difficulty } from "@/types";

export interface ParsedPasteRow {
  lineNumber: number;
  raw: string;
  title: string;
  difficulty: Difficulty;
  url: string;
  pattern: string;
}

export interface ParsePasteResult {
  rows: ParsedPasteRow[];
  error?: string;
}

const URL_RE = /^https?:\/\//i;
const DIFFICULTY_RE = /^(easy|medium|hard)$/i;

function parseLine(raw: string, lineNumber: number): ParsedPasteRow {
  const fields = raw
    .split("|")
    .map((f) => f.trim())
    .filter((f) => f !== "");

  let url = "";
  let difficulty: Difficulty = "";
  const remaining: string[] = [];

  for (const field of fields) {
    if (!url && URL_RE.test(field)) {
      url = field;
      continue;
    }
    if (!difficulty && DIFFICULTY_RE.test(field)) {
      difficulty = (field[0].toUpperCase() + field.slice(1).toLowerCase()) as Difficulty;
      continue;
    }
    remaining.push(field);
  }

  let title = remaining[0] ?? "";
  const pattern = remaining.slice(1).join(" ") ?? "";

  if (title === "" && url !== "") {
    title = deriveTitleFromUrl(url);
  }

  return { lineNumber, raw, title, difficulty, url, pattern };
}

export function parsePasteText(text: string, emptySlotCount: number): ParsePasteResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  if (lines.length > emptySlotCount) {
    const overflow = lines.slice(emptySlotCount);
    return {
      rows: [],
      error: `${lines.length} lines pasted but only ${emptySlotCount} empty slot(s) remain. Lines that don't fit: ${overflow
        .map((l, i) => `#${emptySlotCount + i + 1} "${l}"`)
        .join(", ")}`,
    };
  }

  const rows = lines.map((line, i) => parseLine(line, i + 1));
  return { rows };
}
