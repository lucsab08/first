"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Compass, Home, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

const TABS = [
  { href: "/today", label: "today", Icon: Home },
  { href: "/discover", label: "discover", Icon: Compass },
  { href: "/calendar", label: "calendar", Icon: Calendar },
  { href: "/coach", label: "coach", Icon: Sparkles, isCoach: true },
  { href: "/you", label: "you", Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const coachAccess = trpc.coach.checkAccess.useQuery(undefined, { staleTime: 60_000 });

  // Show coral dot on Coach tab if it's a returning user with a plan they haven't seen
  const hasUnreadCoachSuggestion =
    coachAccess.data?.isPlus === true && (coachAccess.data?.freeUsed ?? 0) === 0;

  return (
    <nav
      role="tablist"
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 h-[68px] bg-surface border-t border-hairline flex items-stretch safe-bottom"
    >
      {TABS.map(({ href, label, Icon, isCoach }) => {
        const active =
          pathname === href || (href !== "/today" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            aria-label={label}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 tap"
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  active ? "text-dusk" : "text-ink-tertiary",
                )}
                strokeWidth={active ? 2.25 : 1.75}
              />
              {isCoach && hasUnreadCoachSuggestion ? (
                <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-coral" />
              ) : null}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium lowercase",
                active ? "text-dusk" : "text-ink-tertiary",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
