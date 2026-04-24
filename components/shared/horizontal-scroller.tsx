import { cn } from "@/lib/utils";

export function HorizontalScroller({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto scroll-hide -mx-5 px-5 snap-x snap-mandatory",
        className,
      )}
    >
      {children}
    </div>
  );
}
