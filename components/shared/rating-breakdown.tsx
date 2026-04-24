import { Star } from "lucide-react";

export function RatingBreakdown({
  average,
  total,
  distribution,
}: {
  average: number;
  total: number;
  distribution?: { 1: number; 2: number; 3: number; 4: number; 5: number };
}) {
  const dist =
    distribution ?? ({
      5: Math.floor(total * 0.72),
      4: Math.floor(total * 0.2),
      3: Math.floor(total * 0.05),
      2: Math.floor(total * 0.02),
      1: total - Math.floor(total * 0.99),
    } as const);

  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-start">
        <p className="font-display text-[32px] font-semibold tabular leading-none">
          {average.toFixed(1)}
        </p>
        <div className="flex items-center gap-0.5 mt-1 text-ink-primary">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < Math.round(average) ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5 text-hairline"
              }
            />
          ))}
        </div>
        <p className="text-xs text-ink-tertiary mt-1 tabular">{total} reviews</p>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        {[5, 4, 3, 2, 1].map((n) => {
          const pct = total > 0 ? (dist[n as 1 | 2 | 3 | 4 | 5] / total) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 tabular text-ink-tertiary">{n}</span>
              <div className="h-1 flex-1 rounded-full bg-hairline overflow-hidden">
                <div className="h-full bg-dusk rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
