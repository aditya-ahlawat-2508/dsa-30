export const CSV_COLUMNS = ["day", "slot", "title", "difficulty", "url", "pattern"];

export function slotsForDay(day) {
  if (day <= 10) return 10;
  if (day <= 18) return 9;
  return 8;
}

export function parseCsvLine(line) {
  return line.split(",").map((field) => field.trim());
}

export function toCsvField(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvRow(values) {
  return values.map(toCsvField).join(",");
}
