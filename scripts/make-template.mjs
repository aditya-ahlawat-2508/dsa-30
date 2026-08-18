import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CSV_COLUMNS, toCsvRow, slotsForDay } from "./lib/csv-columns.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "intake-template.csv");

const rows = [CSV_COLUMNS];

for (let day = 1; day <= 30; day++) {
  for (let slot = 1; slot <= slotsForDay(day); slot++) {
    rows.push([day, slot, "", "", "", ""]);
  }
}

const csv = rows.map(toCsvRow).join("\n") + "\n";
writeFileSync(outPath, csv, "utf8");

console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
