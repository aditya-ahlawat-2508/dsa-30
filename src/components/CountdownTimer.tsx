"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { activeDateSet, localDateKey } from "@/lib/streak";

function msUntilMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function CountdownTimer() {
  const progress = useProgressStore((s) => s.data);
  const hydrated = useProgressStore((s) => s.hydrated);
  // Lazy-init is safe even though it can run during SSR: the component
  // returns null below whenever `!hydrated`, which is always true during
  // SSR, so a server-computed Date never actually reaches the output.
  const [now, setNow] = useState<Date | null>(() => (typeof window === "undefined" ? null : new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!hydrated || !now) return null;

  // Crossing midnight naturally re-derives this from the fresh `now` tick —
  // no separate "new day" handling needed.
  const todayActive = activeDateSet(progress).has(localDateKey(now));
  if (todayActive) return null;

  return (
    <span
      className="hidden items-center gap-1 text-xs text-muted sm:flex"
      title="Time left to keep today's streak alive"
    >
      <Clock size={13} />
      Finish today&apos;s questions in {formatDuration(msUntilMidnight(now))}
    </span>
  );
}
