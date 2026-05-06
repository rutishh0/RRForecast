// V5/src/components/beta/dashboard/CumulativeChart.tsx
//
// Running total of forecast pipeline revenue over the next 24 months.
// Useful as a "trend storytelling" view — shows how revenue builds up
// quarter by quarter, separately from the per-period view in
// PipelineTrend. The terminal value matches the 24mo KPI in the hero
// strip, providing a visual sanity check.

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EngineRecord } from "@/src/lib/beta/types";
import { deriveFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";

interface MonthBucket {
  label: string;
  cumulative: number;
}

const COLOR = "#0e3a5f";

export function CumulativeChart({ engines }: { engines: EngineRecord[] }) {
  const data = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const months: { label: string; revenue: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        revenue: 0,
      });
    }

    for (const e of engines) {
      const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      if (d < now) continue;
      const monthsAhead = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
      if (monthsAhead < 0 || monthsAhead >= 24) continue;
      months[monthsAhead].revenue += deriveFinancials(e).revenue;
    }

    let running = 0;
    return months.map((m) => {
      running += m.revenue;
      return { label: m.label, cumulative: running };
    });
  }, [engines]);

  return (
    <div className="px-2 pb-3 pt-1">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-cumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.55} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e6e2d8" vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b6f78" }} stroke="#9ca0a8" tickLine={false} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b6f78" }}
            stroke="#9ca0a8"
            tickLine={false}
            tickFormatter={(n: number) => formatUSD(n, true)}
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 11,
              padding: "6px 8px",
            }}
            formatter={((v: unknown) => [formatUSD(Number(v ?? 0), true), "Cumulative pipeline value"]) as never}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={COLOR}
            fill="url(#grad-cumulative)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
