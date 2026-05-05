// V5/src/components/beta/dashboard/OperatorMapPlaceholder.tsx
//
// Placeholder for the Leaflet-based OperatorMap. Phase 2.5 will install
// react-leaflet + leaflet, port the world-map primitive, and import the
// OPERATOR_HUBS geocoded city dataset. For now: a list view of top
// operators by engine count.

import { useMemo } from "react";
import type { EngineRecord } from "@/src/lib/beta/types";

export function OperatorMap({ engines, height = 360 }: { engines: EngineRecord[]; height?: number }) {
  const tally = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of engines) {
      const key = e.operator || "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [engines]);

  return (
    <div className="px-2 pb-3 pt-1 flex flex-col" style={{ minHeight: height }}>
      <div className="rounded-md bg-brand/5 border border-brand/15 px-3 py-2 mb-3 mx-2">
        <p className="text-[11px] text-brand-strong">
          Map view coming soon — porting Leaflet integration. Showing top operators by engine count for now.
        </p>
      </div>
      <ul className="flex-1 px-2 grid grid-cols-2 md:grid-cols-3 gap-2">
        {tally.map((row) => (
          <li
            key={row.name}
            className="border border-border rounded bg-surface px-3 py-2 flex items-center justify-between gap-2"
          >
            <span className="text-[12px] text-foreground truncate" title={row.name}>{row.name}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
              {row.count} eng
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
