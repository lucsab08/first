"use client";

import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { NEIGHBORHOODS, WORKOUT_TYPES, TIME_OF_DAY, INTENSITY_LEVELS } from "@/lib/constants";
import { useFilters } from "@/lib/stores/filters";
import { neighborhoodLabel } from "@/lib/utils";

export function FilterSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const s = useFilters();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent heightClass="max-h-[90dvh] h-[90dvh]">
        <div className="flex flex-col h-full">
          <div className="px-5 pt-2 flex items-center justify-between">
            <button
              onClick={() => s.reset()}
              className="text-sm text-ink-secondary underline underline-offset-4 tap"
            >
              Reset
            </button>
            <p className="font-display text-[20px] font-semibold">Filters</p>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-sm text-ink-secondary tap h-8 w-8"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
            <Group label="Neighborhood">
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map((n) => (
                  <Chip
                    key={n}
                    active={s.neighborhoods.includes(n)}
                    onClick={() => s.toggle("neighborhoods", n)}
                  >
                    {neighborhoodLabel(n)}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Class type">
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    active={s.types.includes(t)}
                    onClick={() => s.toggle("types", t)}
                    className="capitalize"
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Time of day">
              <div className="flex flex-wrap gap-2">
                {TIME_OF_DAY.map((t) => (
                  <Chip
                    key={t.id}
                    active={s.timeOfDay === t.id}
                    onClick={() => s.set({ timeOfDay: s.timeOfDay === t.id ? null : t.id })}
                  >
                    {t.label}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Price">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1000}
                  max={6000}
                  step={100}
                  value={s.priceMaxCents}
                  onChange={(e) => s.set({ priceMaxCents: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-dusk"
                />
                <span className="text-sm tabular w-16 text-right">
                  up to ${(s.priceMaxCents / 100).toFixed(0)}
                </span>
              </div>
            </Group>

            <Group label="Intensity">
              <div className="flex flex-wrap gap-2">
                {INTENSITY_LEVELS.map((i) => (
                  <Chip
                    key={i}
                    active={s.intensity === i}
                    onClick={() => s.set({ intensity: s.intensity === i ? null : i })}
                    className="capitalize"
                  >
                    {i}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Beginner-friendly">
              <label className="flex items-center justify-between">
                <span className="text-[15px] text-ink-secondary">
                  Show classes that welcome new folks
                </span>
                <button
                  role="switch"
                  aria-checked={s.beginnerFriendly}
                  onClick={() => s.set({ beginnerFriendly: !s.beginnerFriendly })}
                  className={`h-7 w-12 rounded-full transition-colors ${
                    s.beginnerFriendly ? "bg-dusk" : "bg-hairline"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-paper block transition-transform ${
                      s.beginnerFriendly ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </Group>
          </div>

          <div className="px-5 py-4 border-t border-hairline bg-surface safe-bottom">
            <Button block onClick={onClose}>
              Apply filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-uppercase text-ink-tertiary mb-3">{label}</p>
      {children}
    </div>
  );
}
