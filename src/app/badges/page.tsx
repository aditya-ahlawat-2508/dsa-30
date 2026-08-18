"use client";

import { Trophy, Lock } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";
import { useProgressStore } from "@/store/useProgressStore";
import { BADGES } from "@/lib/badges";
import { TopNav } from "@/components/TopNav";

export default function BadgesPage() {
  const hydrated = useHydrated();
  const earnedBadges = useProgressStore((s) => s.data.earnedBadges);

  return (
    <>
      <TopNav />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-bold">Badges</h1>

        {!hydrated ? (
          <div className="h-64 animate-pulse rounded-xl border border-card-border bg-card" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BADGES.map((badge) => {
              const earnedAt = earnedBadges[badge.id];
              return (
                <li
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-xl border border-card-border bg-card p-4 ${
                    earnedAt ? "" : "opacity-60"
                  }`}
                >
                  {earnedAt ? (
                    <Trophy size={20} className="mt-0.5 shrink-0 text-amber-500" />
                  ) : (
                    <Lock size={20} className="mt-0.5 shrink-0 text-muted" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted">{badge.description}</p>
                    {earnedAt && (
                      <p className="mt-1 text-xs text-accent">
                        Earned {new Date(earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
