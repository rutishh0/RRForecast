// V5/src/components/beta/dashboard/NearTermChart.tsx
//
// Near-term outlook: month-by-month for the next 12 months.
// Bars = removal count (left axis, integer); line = forecast revenue
// for that month (right axis, USD). Lets the user see "what's about
// to happen" with both volume and value at once.
//
// Sourced from EngineRecords with any of removalDate / transitionDate /
// leaseExpiry — same field cascade as the rest of the dashboard.

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EngineRecord } from "@/src/lib/beta/types";
import { deriveFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { LegendDots } from "../charts/ChartCard";

interface MonthBucket {
  label: string;
  removals: number;
  revenue: number;
}

const COLOR_BARS = "#0e3a5f";
const COLOR_LINE = "#d97706";

export function NearTermChart({ engines }: { engines: EngineRecord[] }) {
  const data = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const buckets: MonthBucket[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      buckets.push({
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        removals: 0,
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
      if (monthsAhead < 0 || monthsAhead >= 12) continue;
      buckets[monthsAhead].removals += 1;
      buckets[monthsAhead].revenue += deriveFinancials(e).revenue;
    }
    return buckets;
  }, [engines]);

  return (
    <>
      <div className="px-2 pb-1 pt-1">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#e6e2d8" vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6b6f78" }} stroke="#9ca0a8" tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#6b6f78" }}
              stroke="#9ca0a8"
              tickLine={false}
              allowDecimals={false}
              width={32}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#6b6f78" }}
              stroke="#9ca0a8"
              tickLine={false}
              tickFormatter={(n: number) => formatUSD(n, true)}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontSize: 11,
                padding: "6px 8px",
              }}
              formatter={((v: unknown, n: unknown) => {
                const name = String(n ?? "");
                if (name === "Removals") return [String(v), name];
                return [formatUSD(Number(v ?? 0), true), name];
              }) as never}
            />
            <Bar yAxisId="left" dataKey="removals" name="Removals" fill={COLOR_BARS} radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke={COLOR_LINE} strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 pb-3 pt-1">
        <LegendDots
          items={[
            { label: "Removals (count)", color: COLOR_BARS },
            { label: "Revenue (USD)", color: COLOR_LINE },
          ]}
        />
      </div>
    </>
  );
}
