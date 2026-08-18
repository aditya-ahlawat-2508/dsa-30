"use client";

import { plan } from "@/lib/plan";
import { useHydrated } from "@/lib/useHydrated";
import { TopNav } from "@/components/TopNav";
import { GlobalProgress } from "@/components/GlobalProgress";
import { StreakHeatmap } from "@/components/StreakHeatmap";
import { DueForRevisionStrip } from "@/components/DueForRevisionStrip";
import { DayCard } from "@/components/DayCard";
import { GridSkeleton } from "@/components/Skeleton";

export default function Home() {
  const hydrated = useHydrated();

  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
        {!hydrated ? (
          <>
            <div className="h-20 animate-pulse rounded-xl border border-card-border bg-card" />
            <GridSkeleton />
          </>
        ) : (
          <>
            <GlobalProgress />
            <StreakHeatmap />
            <DueForRevisionStrip />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {plan.days.map((day) => (
                <DayCard key={day.day} day={day} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
