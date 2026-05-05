// V5/src/components/beta/dashboard/PipelineTrend.tsx
//
// 24-month rolling stacked area: 12 months of historical (Completed)
// SV revenue + 12 months of forward (Active pipeline + Forecast).
// Replaces the earlier bar-by-year placeholder.

import { useMemo } from "react";
import type { EngineRecord } from "@/src/lib/beta/types";
import { deriveFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { LegendDots } from "../charts/ChartCard";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthBucket {
  label: string;
  date: number;
  historical: number;
  pipeline: number;
  forecast: number;
}

const SERIES = [
  { key: "historical", label: "Completed", color: "#94a3b8" },
  { key: "pipeline", label: "Active pipeline", color: "#0e3a5f" },
  { key: "forecast", label: "Forecast", color: "#5b9bd5" },
] as const;

export function PipelineTrend({ engines }: { engines: EngineRecord[] }) {
  const data = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const buckets: MonthBucket[] = [];
    for (let i = -12; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      buckets.push({
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        date: d.getTime(),
        historical: 0,
        pipeline: 0,
        forecast: 0,
      });
    }

    for (const e of engines) {
      const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
      if (!iso) continue;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) continue;
      const f = deriveFinancials(e);
      const idx = buckets.findIndex((b) => {
        const bd = new Date(b.date);
        return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
      });
      if (idx === -1) continue;
      if (d < now) {
        buckets[idx].historical += f.revenue;
      } else if (e.stage === "Forecasted") {
        buckets[idx].forecast += f.revenue;
      } else {
        buckets[idx].pipeline += f.revenue;
      }
    }
    return buckets;
  }, [engines]);

  return (
    <>
      <div className="px-2 pb-1 pt-1">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
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
              formatter={((v: unknown, n: unknown) => [
                formatUSD(Number(v ?? 0), true),
                String(n ?? ""),
              ]) as never}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId="1"
                name={s.label}
                stroke={s.color}
                fill={`url(#grad-${s.key})`}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 pb-3 pt-1">
        <LegendDots items={SERIES.map((s) => ({ label: s.label, color: s.color }))} />
      </div>
    </>
  );
}
