import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-[18px] font-semibold text-ink-primary">{title}</h2>
      {action ? (
        <Link href={action.href} className="text-sm text-ink-secondary tap">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
