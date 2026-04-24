export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink-primary flex flex-col">
      {children}
    </div>
  );
}
