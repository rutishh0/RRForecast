// V5/src/pages/beta/DashboardPage.tsx
//
// Beta dashboard — KPIs + charts. Pulls V5's loaded engine data via
// useAppData(), funnels through the toEngineRecords() adapter into the
// unified EngineRecord shape that all beta charts consume.

import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { portfolioKpis } from "@/src/lib/beta/aggregations";
import { aggregateFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { PageShell } from "@/src/components/beta/PageShell";
import { HeroMetric } from "@/src/components/beta/data/Metric";
import { ChartCard } from "@/src/components/beta/charts/ChartCard";
import { FamilyDonut } from "@/src/components/beta/dashboard/FamilyDonut";
import { TopLessors } from "@/src/components/beta/dashboard/TopLessors";
import { StageFunnel } from "@/src/components/beta/dashboard/StageFunnel";
import { ActionQueue } from "@/src/components/beta/dashboard/ActionQueue";
import { RemovalHeatmap } from "@/src/components/beta/dashboard/RemovalHeatmap";
import { PipelineTrend } from "@/src/components/beta/dashboard/PipelineTrend";
import { OperatorMap } from "@/src/components/beta/dashboard/OperatorMap";

export default function BetaDashboardPage() {
  const { shopVisits, forecasts } = useAppData();

  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  const kpis = useMemo(() => portfolioKpis(engines), [engines]);
  const fin = useMemo(() => aggregateFinancials(engines), [engines]);

  if (engines.length === 0) {
    return (
      <PageShell
        title="Dashboard"
        description="Operational state of the managed Trent engine portfolio."
      >
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Click <span className="font-semibold text-foreground">Upload</span> in the
            top bar to import the latest workbook.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      description="Operational state of the managed Trent engine portfolio."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroMetric
          variant="blue"
          label="Engines under management"
          value={kpis.totalEngines}
          sub={`${kpis.activeCount} active · ${kpis.forecastCount} forecast`}
        />
        <HeroMetric
          variant="amber"
          label="Removals next 12 months"
          value={kpis.next12Count}
          sub="across the engine portfolio"
        />
        <HeroMetric
          variant="teal"
          label="Active pipeline value"
          value={formatUSD(kpis.activeValue, true)}
          sub={`${kpis.activeCount} engines in shop`}
        />
        <HeroMetric
          variant="ink"
          label="Forecast revenue · 24mo"
          value={formatUSD(fin.revenue, true)}
          sub={`${Math.round(fin.marginPct)}% projected margin`}
        />
      </div>

      <div className="grid grid-cols-12 gap-4 mt-4">
        <ChartCard
          className="col-span-12 lg:col-span-8"
          title="Pipeline value · annual"
          subtitle="Forecasted revenue by removal year"
        >
          <PipelineTrend engines={engines} />
        </ChartCard>

        <ChartCard
          className="col-span-12 lg:col-span-4"
          title="Fleet composition"
          subtitle="Engines by family"
        >
          <FamilyDonut engines={engines} />
        </ChartCard>

        <ChartCard
          className="col-span-12 lg:col-span-5"
          title="Pipeline distribution"
          subtitle="Engines by current shop visit stage"
        >
          <StageFunnel engines={engines} />
        </ChartCard>

        <ChartCard
          className="col-span-12 lg:col-span-7"
          title="Top lessors"
          subtitle="By engines under management — revenue at right"
        >
          <TopLessors engines={engines} />
        </ChartCard>

        <ChartCard
          className="col-span-12"
          title="Removal density · next 24 months"
          subtitle="Forecasted shop removals by engine family — color intensity ∝ count"
        >
          <RemovalHeatmap engines={engines} />
        </ChartCard>

        <ChartCard
          className="col-span-12 lg:col-span-7"
          title="Operator network"
          subtitle="Active engines by operator hub"
        >
          <OperatorMap engines={engines} height={380} />
        </ChartCard>

        <ChartCard
          className="col-span-12 lg:col-span-5"
          title="Action queue"
          subtitle="Engines requiring portfolio team attention"
        >
          <ActionQueue engines={engines} />
        </ChartCard>
      </div>
    </PageShell>
  );
}
