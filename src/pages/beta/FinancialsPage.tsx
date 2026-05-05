// V5/src/pages/beta/FinancialsPage.tsx
import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { aggregateFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { PageShell } from "@/src/components/beta/PageShell";
import { Metric, MetricStrip } from "@/src/components/beta/data/Metric";
import { ChartCard } from "@/src/components/beta/charts/ChartCard";
import { FamilyTable } from "@/src/components/beta/financials/FamilyTable";
import { LessorTable } from "@/src/components/beta/financials/LessorTable";
import { RevenueBars } from "@/src/components/beta/financials/RevenueBars";

export default function BetaFinancialsPage() {
  const { shopVisits, forecasts } = useAppData();
  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  const fin = useMemo(() => aggregateFinancials(engines), [engines]);

  if (engines.length === 0) {
    return (
      <PageShell title="Financials" description="Revenue, margin, and cash-out exposure across the portfolio.">
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Upload a workbook to populate the financial breakdown.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Financials"
      description={`${formatUSD(fin.revenue, true)} forecasted · ${Math.round(fin.marginPct)}% margin · ${formatUSD(fin.cashOutWeighted, true)} weighted cash-out exposure`}
    >
      <MetricStrip>
        <Metric label="Revenue forecast" value={formatUSD(fin.revenue, true)} sub="At list price" accent="blue" />
        <Metric label="Contribution" value={formatUSD(fin.contribution, true)} sub={`${Math.round(fin.marginPct)}% margin`} accent="teal" />
        <Metric label="Profit" value={formatUSD(fin.profit, true)} sub="55% pass-through" accent="sage" />
        <Metric
          label="Cash-out exposure"
          value={formatUSD(fin.cashOutWeighted, true)}
          sub={`${fin.cashOutCount} engines flagged`}
          accent="amber"
        />
      </MetricStrip>

      <div className="grid grid-cols-12 gap-4 mt-4">
        <ChartCard
          className="col-span-12 lg:col-span-7"
          title="Revenue by year"
          subtitle="Forecasted SV value bucketed by removal year"
        >
          <RevenueBars engines={engines} />
        </ChartCard>
        <ChartCard
          className="col-span-12 lg:col-span-5"
          title="By engine family"
          subtitle="Revenue, average ticket, projected margin"
        >
          <FamilyTable engines={engines} />
        </ChartCard>
        <ChartCard
          className="col-span-12"
          title="By lessor"
          subtitle="Revenue, profit, margin, cash-out exposure"
        >
          <LessorTable engines={engines} />
        </ChartCard>
      </div>
    </PageShell>
  );
}
