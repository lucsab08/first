import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink-primary flex flex-col">
      <main className="flex-1 pb-[88px] safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
