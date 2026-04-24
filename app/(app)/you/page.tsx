"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Edit2,
  Flame,
  HelpCircle,
  LogOut,
  Settings2,
  Star,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoadingMarkCentered } from "@/components/brand/loading-mark";
import { GOALS } from "@/lib/constants";
import { cn, formatCents, neighborhoodLabel } from "@/lib/utils";

export default function YouPage() {
  const me = trpc.auth.me.useQuery();
  const stats = trpc.user.stats.useQuery();
  const sub = trpc.subscription.status.useQuery();
  const saved = trpc.studio.savedList.useQuery();
  const history = trpc.booking.history.useQuery({ limit: 5 });
  const portal = trpc.subscription.portalUrl.useMutation();
  const checkout = trpc.subscription.checkoutUrl.useMutation();

  if (me.isLoading || !me.data) return <LoadingMarkCentered />;

  const isPlus =
    sub.data?.tier === "plus" && (sub.data.status === "active" || sub.data.status === "trialing");
  const memberSince = me.data.onboardedAt
    ? format(new Date(me.data.onboardedAt), "MMMM yyyy")
    : null;

  return (
    <div className="px-5 pt-4 pb-10 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Avatar className="h-[72px] w-[72px]">
          {me.data.avatarUrl ? <AvatarImage src={me.data.avatarUrl} alt="" /> : null}
          <AvatarFallback>
            <Star className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-[24px] font-semibold leading-tight">
            {me.data.fullName ?? "Member"}
          </h1>
          {memberSince ? (
            <p className="text-sm text-ink-tertiary">Member since {memberSince}</p>
          ) : null}
        </div>
        <button aria-label="Edit profile" className="h-11 w-11 rounded-full bg-elevated flex items-center justify-center tap">
          <Edit2 className="h-4 w-4" />
        </button>
      </header>

      {/* Membership */}
      {isPlus ? (
        <Card className="p-5 bg-dusk text-paper">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-paper/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-paper" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px]">SyncFit+</p>
              {sub.data?.currentPeriodEnd ? (
                <p className="text-sm text-paper/80">
                  Renews {format(new Date(sub.data.currentPeriodEnd), "MMM d, yyyy")}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const r = await portal.mutateAsync();
                if (r.url) window.location.href = r.url;
              }}
              className="bg-paper/15 text-paper"
            >
              Manage
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="font-display text-[20px] font-semibold">Unlock Coach</p>
          <p className="text-sm text-ink-secondary mt-1">
            Let Coach plan your week around your job and recovery. $14.99/mo · 7-day trial.
          </p>
          <Button
            size="md"
            className="mt-3"
            onClick={async () => {
              const r = await checkout.mutateAsync();
              if (r.url) window.location.href = r.url;
            }}
          >
            Start free trial
          </Button>
        </Card>
      )}

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCell label="Total classes" value={stats.data?.totalClasses ?? 0} />
        <StatCell label="Studios tried" value={stats.data?.studiosTried ?? 0} />
        <StatCell
          label="Streak"
          value={stats.data?.currentStreak ?? 0}
          suffix={`wk${(stats.data?.currentStreak ?? 0) === 1 ? "" : "s"}`}
          Icon={Flame}
          iconClass="text-sage"
        />
      </section>

      {/* Goals */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="label-uppercase text-ink-tertiary mb-1">Goals</p>
            <p className="text-[15px] font-medium">
              {(me.data.preferences?.goals ?? [])
                .map((g) => GOALS.find((x) => x.id === g)?.label)
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
            <p className="text-sm text-ink-secondary mt-2">
              {me.data.preferences?.weeklyGoal ?? 4} classes / week ·{" "}
              {(me.data.preferences?.neighborhoods ?? []).map(neighborhoodLabel).join(" · ")}
            </p>
          </div>
          <Link href="/you/preferences" className="text-sm text-ink-primary underline underline-offset-4 tap">
            Edit
          </Link>
        </div>
      </Card>

      {/* Saved studios */}
      {saved.data && saved.data.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] font-semibold">Saved studios</h2>
            <Link href="/discover?saved=1" className="text-sm text-ink-secondary">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scroll-hide -mx-5 px-5">
            {saved.data.map((s) => (
              <Link
                key={s.id}
                href={`/studio/${s.slug}`}
                className="shrink-0 w-32 tap"
              >
                <img
                  src={s.coverImageUrl ?? ""}
                  alt=""
                  className="aspect-[4/5] w-full object-cover rounded-2xl"
                  loading="lazy"
                />
                <p className="text-sm font-medium mt-2 truncate-1">{s.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Booking history */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[18px] font-semibold">Recent bookings</h2>
          <Link href="/you/history" className="text-sm text-ink-secondary">
            See all
          </Link>
        </div>
        <div className="divide-y divide-hairline">
          {(history.data ?? []).length === 0 ? (
            <p className="text-sm text-ink-tertiary py-3">Nothing completed yet. Book one and come back.</p>
          ) : (
            (history.data ?? []).map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium truncate-1">{b.session.class.name}</p>
                  <p className="text-xs text-ink-tertiary truncate-1">
                    {b.session.studio.name} ·{" "}
                    <span className="tabular">
                      {format(new Date(b.session.startTime), "MMM d")}
                    </span>
                  </p>
                </div>
                <div className="tabular text-sm text-ink-tertiary">
                  {formatCents(b.session.class.priceCents)}
                </div>
                <button className="text-sm text-ink-primary underline underline-offset-4 tap">Rate</button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Settings list */}
      <section className="divide-y divide-hairline">
        <SettingsRow Icon={Bell} label="Notifications" href="/you/notifications" />
        <SettingsRow Icon={Settings2} label="Preferences" href="/you/preferences" />
        <SettingsRow Icon={CreditCard} label="Payment" onClick={async () => {
          const r = await portal.mutateAsync();
          if (r.url) window.location.href = r.url;
        }} />
        <SettingsRow Icon={Sparkles} label="Subscription" onClick={async () => {
          if (isPlus) {
            const r = await portal.mutateAsync();
            if (r.url) window.location.href = r.url;
          } else {
            const r = await checkout.mutateAsync();
            if (r.url) window.location.href = r.url;
          }
        }} />
        <SettingsRow Icon={Calendar} label="Calendar sync" href="/you/calendar-sync" />
        <SettingsRow Icon={HelpCircle} label="Help" href="/you/help" />
        <SettingsRow Icon={LogOut} label="Sign out" href="/api/signout" />
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  suffix,
  Icon,
  iconClass,
}: {
  label: string;
  value: number;
  suffix?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <Card className="p-4 flex flex-col items-start">
      <p className="label-uppercase text-ink-tertiary">{label}</p>
      <div className="flex items-baseline gap-1 mt-2">
        {Icon ? <Icon className={cn("h-4 w-4 self-center", iconClass)} /> : null}
        <span className="font-display text-[24px] font-semibold tabular leading-none">{value}</span>
        {suffix ? <span className="text-sm text-ink-tertiary tabular">{suffix}</span> : null}
      </div>
    </Card>
  );
}

function SettingsRow({
  Icon,
  label,
  href,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-3 py-4 w-full tap">
      <Icon className="h-5 w-5 text-ink-tertiary" />
      <span className="flex-1 text-[15px]">{label}</span>
      <ChevronRight className="h-4 w-4 text-ink-tertiary" />
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return (
    <button className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}
