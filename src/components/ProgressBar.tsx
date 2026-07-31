export function ProgressBar({ solved, total }: { solved: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${solved} of ${total} solved`}
      className="h-1.5 w-full overflow-hidden rounded-full bg-accent-tint"
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
