// V5/src/components/beta/dashboard/TopLessors.tsx
import { useMemo } from "react";
import type { EngineRecord } from "@/src/lib/beta/types";
import { aggregateFinancials } from "@/src/lib/beta/finance";
import { HBars } from "../charts/HBars";
import { formatUSD } from "@/src/lib/beta/format";

export function TopLessors({ engines, limit = 8 }: { engines: EngineRecord[]; limit?: number }) {
  const data = useMemo(() => {
    const map = new Map<string, EngineRecord[]>();
    for (const e of engines) {
      const list = map.get(e.lessor) ?? [];
      list.push(e);
      map.set(e.lessor, list);
    }
    return Array.from(map.entries())
      .map(([name, list]) => {
        const fin = aggregateFinancials(list);
        return {
          name,
          value: list.length,
          rightValue: formatUSD(fin.revenue, true),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [engines]);

  return <HBars data={data} limit={limit} formatter={(n) => `${n} eng`} />;
}
