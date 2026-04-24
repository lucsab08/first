import { cn } from "@/lib/utils";

/**
 * Circular progress ring used on the Today greeting (§9.2) and streak UI.
 */
export function ProgressRing({
  value,
  target,
  size = 56,
  strokeWidth = 4,
  className,
  label,
}: {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, target > 0 ? value / target : 0);
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${value} of ${target}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ECEAE4"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1B3A4B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 480ms cubic-bezier(0.32,0.72,0.24,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular text-ink-primary">
        {value}/{target}
      </span>
    </div>
  );
}
