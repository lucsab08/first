import { Mark } from "./mark";
import { cn } from "@/lib/utils";

/**
 * App icon per §2.5 — lemniscate centered on dusk squircle with 22% safe margin.
 */
export function AppIcon({
  size = 96,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const innerSize = size * (1 - 0.22 * 2); // 56% of outer
  const radius = size * 0.22; // iOS squircle-ish corner radius

  return (
    <div
      className={cn("flex items-center justify-center bg-dusk", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
      aria-label="syncfit"
    >
      <Mark size={innerSize} stroke="#FAFAF7" />
    </div>
  );
}
