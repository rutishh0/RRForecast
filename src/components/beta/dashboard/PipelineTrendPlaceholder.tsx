// V5/src/components/beta/dashboard/PipelineTrendPlaceholder.tsx
//
// Placeholder for the v0 PipelineTrend (24-month stacked area). Phase 2.5
// will port the full AreaTrend primitive + recharts area composition.
// For now: a simple bar version showing revenue by year so the dashboard
// has visible content in this slot.

import { useMemo } from "react";
import type { EngineRecord } from "@/src/lib/beta/types";
import { revenueByYear } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PipelineTrend({ engines }: { engines: EngineRecord[] }) {
  const data = useMemo(() => revenueByYear(engines), [engines]);

  return (
    <div className="px-2 pb-3 pt-1">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e6e2d8" vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#6b6f78" }} stroke="#9ca0a8" tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b6f78" }}
            stroke="#9ca0a8"
            tickLine={false}
            tickFormatter={(n: number) => formatUSD(n, true)}
            width={60}
          />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, padding: "6px 8px" }}
            formatter={((v: unknown) => [formatUSD(Number(v ?? 0), true), "Revenue"]) as never}
          />
          <Bar dataKey="value" fill="#0e3a5f" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
