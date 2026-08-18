import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CSV_COLUMNS, parseCsvLine, slotsForDay } from "./lib/csv-columns.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const planPath = join(__dirname, "..", "src", "data", "plan.json");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/sheet-to-plan.mjs <path-to-csv>");
  process.exit(1);
}

const DAYS = 30;
const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard", ""]);

const SLUG_WORD_OVERRIDES = {
  Bst: "BST",
  Ii: "II",
  Iii: "III",
  Lru: "LRU",
  Kth: "Kth",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function questionId(day, slot) {
  return `d${pad2(day)}-q${pad2(slot)}`;
}

function emptyQuestion(day, slot) {
  return {
    id: questionId(day, slot),
    title: "",
    difficulty: "",
    pattern: "",
    tags: [],
    links: { primary: "", editorial: "", video: "" },
  };
}

function emptyPlan() {
  const days = [];
  for (let day = 1; day <= DAYS; day++) {
    const questions = [];
    for (let slot = 1; slot <= slotsForDay(day); slot++) {
      questions.push(emptyQuestion(day, slot));
    }
    days.push({ day, topic: "", goal: "", questions });
  }
  return {
    schemaVersion: 1,
    title: "30-Day DSA Revision",
    startDate: "",
    questionsPerDay: 8,
    days,
  };
}

function loadPlan() {
  if (!existsSync(planPath)) {
    return emptyPlan();
  }
  const raw = readFileSync(planPath, "utf8");
  return JSON.parse(raw);
}

function deriveTitleFromUrl(url) {
  const match = url.match(/\/problems\/([a-z0-9-]+)\/?/i);
  if (!match) return "";
  const slug = match[1];
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const capitalised = word[0].toUpperCase() + word.slice(1).toLowerCase();
      return SLUG_WORD_OVERRIDES[capitalised] ?? capitalised;
    })
    .join(" ");
}

function parseCsv(text) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  const isHeader = CSV_COLUMNS.every((col, i) => header[i] === col);
  const dataLines = isHeader ? lines.slice(1) : lines;
  const startLineNumber = isHeader ? 2 : 1;

  return dataLines.map((line, i) => ({
    lineNumber: startLineNumber + i,
    fields: parseCsvLine(line),
  }));
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const csvText = readFileSync(csvPath, "utf8");
const rows = parseCsv(csvText);

const plan = loadPlan();
const seenSlots = new Map();

for (const { lineNumber, fields } of rows) {
  const [dayRaw, slotRaw, titleRaw, difficultyRaw, urlRaw, patternRaw] = fields;

  const day = Number(dayRaw);
  const slot = Number(slotRaw);

  if (!Number.isInteger(day) || day < 1 || day > DAYS) {
    fail(`line ${lineNumber}: day "${dayRaw}" out of range (must be 1-${DAYS})`);
  }
  const maxSlot = slotsForDay(day);
  if (!Number.isInteger(slot) || slot < 1 || slot > maxSlot) {
    fail(`line ${lineNumber}: slot "${slotRaw}" out of range (must be 1-${maxSlot})`);
  }

  const key = `${day}-${slot}`;
  if (seenSlots.has(key)) {
    fail(
      `duplicate (day, slot) = (${day}, ${slot}) at line ${lineNumber}, already seen at line ${seenSlots.get(key)}`
    );
  }
  seenSlots.set(key, lineNumber);

  const difficulty = (difficultyRaw ?? "").trim();
  if (!VALID_DIFFICULTIES.has(difficulty)) {
    fail(
      `line ${lineNumber}: difficulty "${difficulty}" invalid (must be Easy, Medium, Hard, or blank)`
    );
  }

  const url = (urlRaw ?? "").trim();
  let title = (titleRaw ?? "").trim();
  if (title === "" && url !== "") {
    title = deriveTitleFromUrl(url);
  }

  const pattern = (patternRaw ?? "").trim();

  const question = plan.days[day - 1].questions[slot - 1];
  const expectedId = questionId(day, slot);
  if (question.id !== expectedId) {
    fail(
      `internal invariant violated: plan.json slot (day ${day}, slot ${slot}) has id "${question.id}", expected "${expectedId}"`
    );
  }

  question.title = title;
  question.difficulty = difficulty;
  question.pattern = pattern;
  question.links.primary = url;
}

writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
console.log(`Wrote ${rows.length} row(s) into ${planPath}`);
