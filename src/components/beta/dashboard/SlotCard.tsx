// V5/src/components/beta/dashboard/SlotCard.tsx
//
// A "slot" on the dashboard — a ChartCard that lets the user pick which
// chart renders inside it from a curated list, and remembers the choice
// in localStorage. Every visible card on the dashboard is a SlotCard,
// keyed by `slotId`. Selection is persisted under
// `rr.dashboard.slot.<slotId>`. If the saved key is no longer one of the
// allowed options for that slot (e.g. we renamed/removed it in a later
// release), we silently fall back to `defaultKey` rather than crashing.
//
// We deliberately avoid an explicit "pin" toggle: every selection is
// persisted, the visible <Pin> icon just confirms the current view is
// what shows by default. Keeping the model single-state ("the current
// choice IS the pinned choice") avoids a class of "I picked it but it
// reset on reload" bugs.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pin } from "lucide-react";
import { ChartCard } from "@/src/components/beta/charts/ChartCard";

export interface SlotOption {
  /** Stable storage key — never rename, persisted to localStorage. */
  key: string;
  /** Label shown in the dropdown and the card heading. */
  label: string;
  /** Subtitle shown beneath the heading when this option is active. */
  subtitle: string;
  /** The actual chart to render. */
  render: () => ReactNode;
}

interface SlotCardProps {
  slotId: string;
  defaultKey: string;
  options: SlotOption[];
  className?: string;
}

const STORAGE_PREFIX = "rr.dashboard.slot.";

function readSaved(slotId: string): string | null {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + slotId);
  } catch {
    return null;
  }
}

function writeSaved(slotId: string, value: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + slotId, value);
  } catch {
    /* localStorage may be unavailable (private browsing) — fall back to in-memory */
  }
}

export function SlotCard({ slotId, defaultKey, options, className }: SlotCardProps) {
  // Resolve the initial active key:  saved choice → defaultKey → first option.
  const [activeKey, setActiveKey] = useState<string>(() => {
    const saved = readSaved(slotId);
    if (saved && options.some((o) => o.key === saved)) return saved;
    if (options.some((o) => o.key === defaultKey)) return defaultKey;
    return options[0]?.key ?? defaultKey;
  });

  // If the option list changes underfoot (we shipped a new release that
  // removed this chart), drop back to the default rather than rendering
  // nothing.
  useEffect(() => {
    if (!options.some((o) => o.key === activeKey)) {
      setActiveKey(defaultKey);
    }
  }, [options, activeKey, defaultKey]);

  const active = useMemo(
    () => options.find((o) => o.key === activeKey) ?? options[0],
    [options, activeKey],
  );

  function handleChange(next: string) {
    setActiveKey(next);
    writeSaved(slotId, next);
  }

  if (!active) return null;

  const isPinned = readSaved(slotId) === activeKey;

  return (
    <ChartCard
      className={className}
      title={active.label}
      subtitle={active.subtitle}
      trailing={
        <div className="flex items-center gap-1.5">
          <Pin
            className={`size-3.5 ${isPinned ? "text-brand fill-brand/20" : "text-muted-foreground/40"}`}
            aria-label={isPinned ? "Pinned as default" : "Not pinned"}
          />
          <select
            value={activeKey}
            onChange={(e) => handleChange(e.target.value)}
            className="h-7 px-2 pr-6 bg-surface-muted border border-border rounded text-[11px] text-foreground hover:bg-surface-subtle focus:bg-surface focus:outline-none focus:border-foreground cursor-pointer"
            aria-label="Choose chart"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {active.render()}
    </ChartCard>
  );
}
