// V5/src/pages/beta/ForecastPage.tsx
//
// Beta replacement for EngineForecast. Annual forecast bars + filterable
// forecast records table. Shows engines with a removal date — both
// in-flight active SVs and pure forecasts.

import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { revenueByYear } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { PageShell } from "@/src/components/beta/PageShell";
import { ChartCard } from "@/src/components/beta/charts/ChartCard";
import { ForecastTable } from "@/src/components/beta/forecast/ForecastTable";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function BetaForecastPage() {
  const { shopVisits, forecasts } = useAppData();
  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  const yearly = useMemo(() => revenueByYear(engines), [engines]);
  const totalForecastValue = yearly.reduce((s, y) => s + y.value, 0);
  const totalEngines = engines.filter((e) => e.removalDate ?? e.transitionDate ?? e.leaseExpiry).length;

  if (engines.length === 0) {
    return (
      <PageShell title="Forecast" description="Engine removal forecast and financial outlook.">
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Upload a workbook to populate the forecast.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Forecast"
      description={`${totalEngines} engines with removal dates · ${formatUSD(totalForecastValue, true)} forecasted revenue`}
    >
      <ChartCard
        title="Forecasted revenue by year"
        subtitle="SV value bucketed by removal year (or transition / lease end)"
        className="mb-4"
      >
        <div className="px-2 pb-3 pt-1">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yearly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
      </ChartCard>

      <ChartCard title="All forecast records" subtitle="Sorted by removal date">
        <ForecastTable engines={engines} />
      </ChartCard>
    </PageShell>
  );
}
