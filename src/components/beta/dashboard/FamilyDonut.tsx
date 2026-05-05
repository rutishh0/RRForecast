// V5/src/components/beta/dashboard/FamilyDonut.tsx
import { useMemo } from "react";
import type { EngineRecord, EngineFamily } from "@/src/lib/beta/types";
import { Donut } from "../charts/Donut";
import { CAT } from "@/src/lib/beta/chart-theme";

const FALLBACK = "#475569";

export function FamilyDonut({ engines }: { engines: EngineRecord[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of engines) counts.set(e.engineType, (counts.get(e.engineType) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value, color: CAT[name as EngineFamily] ?? FALLBACK }))
      .sort((a, b) => b.value - a.value);
  }, [engines]);

  return (
    <div className="flex flex-col">
      <Donut data={data} height={200} centerValue={String(engines.length)} centerLabel="Engines" />
      <ul className="px-4 pb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="size-2 rounded-[2px] shrink-0" style={{ background: d.color }} />
              <span className="truncate text-foreground">{d.name}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
