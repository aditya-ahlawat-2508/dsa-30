export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-card-border bg-card" />
      ))}
    </div>
  );
}

export function DaySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-24 animate-pulse rounded-xl border border-card-border bg-card" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg border border-card-border bg-card" />
      ))}
    </div>
  );
}
