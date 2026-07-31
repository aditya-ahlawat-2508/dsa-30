import planJson from "@/data/plan.json";
import type { Plan } from "@/types";

export const plan = planJson as Plan;

export function getDay(dayNumber: number) {
  return plan.days.find((d) => d.day === dayNumber) ?? null;
}

export function dayIsEmpty(dayNumber: number): boolean {
  const day = getDay(dayNumber);
  if (!day) return true;
  return day.questions.every((q) => q.title === "");
}
