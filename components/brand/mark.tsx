import { cn } from "@/lib/utils";

/**
 * Asymmetric lemniscate — the right loop is ~13% larger than the left.
 * Drawn in a single continuous path. §2.5
 */
export function Mark({
  size = 32,
  className,
  stroke = "currentColor",
  strokeWidth,
}: {
  size?: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  // Base stroke weight is 4pt at 64px, so stroke-width scales with size.
  const sw = strokeWidth ?? (4 * size) / 64;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("", className)}
      aria-hidden="true"
    >
      <path d="M 32 32 C 22 22 10 22 10 32 C 10 42 22 42 32 32 C 43 21 57 21 57 32 C 57 43 43 43 32 32" />
    </svg>
  );
}

/** Wordmark — Fraunces Semibold Italic, lowercase. §2.4 */
export function Wordmark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("font-display-italic font-semibold text-ink-primary select-none", className)}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      syncfit
    </span>
  );
}

export function Logo({
  size = 24,
  markOnLeft = false,
  className,
  tone = "ink",
}: {
  size?: number;
  markOnLeft?: boolean;
  className?: string;
  tone?: "ink" | "paper";
}) {
  const toneColor = tone === "paper" ? "text-paper" : "text-ink-primary";
  return (
    <span className={cn("inline-flex items-center gap-2", toneColor, className)}>
      {markOnLeft && <Mark size={size} />}
      <Wordmark size={size} />
    </span>
  );
}
