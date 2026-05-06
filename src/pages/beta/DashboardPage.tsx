// V5/src/pages/beta/DashboardPage.tsx
//
// Beta dashboard — KPIs (fixed) + 7 swappable chart slots. Each slot
// has its own SlotCard that lets the user pick from a curated list of
// charts and pin the choice to localStorage. The slot defaults match
// the original layout so reading the dashboard cold still tells the
// same story.
//
// Slot sizing rationale:
//   - "wide"   = col-span-8/12   (PipelineTrend, NearTerm, Cumulative,
//                                  RemovalHeatmap, OperatorMap)
//   - "narrow" = col-span-4/12   (donut/funnel/queue — small surfaces)
//   - "med-wide" = col-span-7/12 (TopLessors, OperatorMap)
//   - "med-narrow" = col-span-5/12 (StageFunnel, ActionQueue)
//   - "full"   = col-span-12     (heatmap, network)
// We deliberately let the same chart appear in multiple slots' option
// lists — the user owns the layout, and duplication is their call.

import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { portfolioKpis } from "@/src/lib/beta/aggregations";
import { aggregateFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { PageShell } from "@/src/components/beta/PageShell";
import { HeroMetric } from "@/src/components/beta/data/Metric";
import { SlotCard, type SlotOption } from "@/src/components/beta/dashboard/SlotCard";
import { FamilyDonut } from "@/src/components/beta/dashboard/FamilyDonut";
import { TopLessors } from "@/src/components/beta/dashboard/TopLessors";
import { StageFunnel } from "@/src/components/beta/dashboard/StageFunnel";
import { ActionQueue } from "@/src/components/beta/dashboard/ActionQueue";
import { RemovalHeatmap } from "@/src/components/beta/dashboard/RemovalHeatmap";
import { PipelineTrend } from "@/src/components/beta/dashboard/PipelineTrend";
import { OperatorMap } from "@/src/components/beta/dashboard/OperatorMap";
import { NearTermChart } from "@/src/components/beta/dashboard/NearTermChart";
import { CumulativeChart } from "@/src/components/beta/dashboard/CumulativeChart";
import type { EngineRecord } from "@/src/lib/beta/types";

export default function BetaDashboardPage() {
  const { shopVisits, forecasts } = useAppData();

  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  const kpis = useMemo(() => portfolioKpis(engines), [engines]);
  const fin = useMemo(() => aggregateFinancials(engines), [engines]);

  // ---------------------------------------------------------------------
  // Chart option catalogue. Each entry produces a SlotOption; the slot
  // configs below pick a subset of these by key. Defining them once means
  // a slot only has to express *which* charts it offers, not how to
  // render or label them.
  // ---------------------------------------------------------------------
  const opts = useMemo(() => buildOptions(engines), [engines]);

  return (
    <PageShell
      title="Dashboard"
      description="Operational state of the managed Trent engine portfolio."
    >
      {engines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Click <span className="font-semibold text-foreground">Upload</span> in the
            top bar to import the latest workbook.
          </p>
        </div>
      ) : (
        <>
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
            <SlotCard
              slotId="dashboard-1"
              defaultKey="pipelineTrend"
              className="col-span-12 lg:col-span-8"
              options={pickOptions(opts, ["pipelineTrend", "nearTerm", "cumulative", "removalHeatmap", "operatorMapMd"])}
            />
            <SlotCard
              slotId="dashboard-2"
              defaultKey="familyDonut"
              className="col-span-12 lg:col-span-4"
              options={pickOptions(opts, ["familyDonut", "stageFunnel", "actionQueue"])}
            />
            <SlotCard
              slotId="dashboard-3"
              defaultKey="stageFunnel"
              className="col-span-12 lg:col-span-5"
              options={pickOptions(opts, ["stageFunnel", "familyDonut", "actionQueue"])}
            />
            <SlotCard
              slotId="dashboard-4"
              defaultKey="topLessors"
              className="col-span-12 lg:col-span-7"
              options={pickOptions(opts, ["topLessors", "pipelineTrend", "nearTerm", "cumulative", "operatorMapMd"])}
            />
            <SlotCard
              slotId="dashboard-5"
              defaultKey="removalHeatmap"
              className="col-span-12"
              options={pickOptions(opts, ["removalHeatmap", "operatorMapLg", "pipelineTrend", "cumulative"])}
            />
            <SlotCard
              slotId="dashboard-6"
              defaultKey="operatorMapMd"
              className="col-span-12 lg:col-span-7"
              options={pickOptions(opts, ["operatorMapMd", "topLessors", "pipelineTrend", "nearTerm", "cumulative"])}
            />
            <SlotCard
              slotId="dashboard-7"
              defaultKey="actionQueue"
              className="col-span-12 lg:col-span-5"
              options={pickOptions(opts, ["actionQueue", "stageFunnel", "familyDonut"])}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}

// All options keyed by stable id. Adding a new chart = add an entry here
// and reference its key in whichever slot's option list should expose it.
function buildOptions(engines: EngineRecord[]): Record<string, SlotOption> {
  return {
    pipelineTrend: {
      key: "pipelineTrend",
      label: "Pipeline value · annual",
      subtitle: "Forecasted revenue by removal year",
      render: () => <PipelineTrend engines={engines} />,
    },
    nearTerm: {
      key: "nearTerm",
      label: "Near-term forecast · 12mo",
      subtitle: "Removal volume and revenue, month by month",
      render: () => <NearTermChart engines={engines} />,
    },
    cumulative: {
      key: "cumulative",
      label: "Cumulative pipeline · 24mo",
      subtitle: "Running total of forecast revenue over the next two years",
      render: () => <CumulativeChart engines={engines} />,
    },
    familyDonut: {
      key: "familyDonut",
      label: "Fleet composition",
      subtitle: "Engines by family",
      render: () => <FamilyDonut engines={engines} />,
    },
    stageFunnel: {
      key: "stageFunnel",
      label: "Pipeline distribution",
      subtitle: "Engines by current shop visit stage",
      render: () => <StageFunnel engines={engines} />,
    },
    topLessors: {
      key: "topLessors",
      label: "Top lessors",
      subtitle: "By engines under management — revenue at right",
      render: () => <TopLessors engines={engines} />,
    },
    removalHeatmap: {
      key: "removalHeatmap",
      label: "Removal density · next 24 months",
      subtitle: "Forecasted shop removals by engine family — color intensity ∝ count",
      render: () => <RemovalHeatmap engines={engines} />,
    },
    operatorMapMd: {
      key: "operatorMapMd",
      label: "Operator network",
      subtitle: "Active engines by operator hub",
      render: () => <OperatorMap engines={engines} height={380} />,
    },
    operatorMapLg: {
      key: "operatorMapLg",
      label: "Operator network",
      subtitle: "Active engines by operator hub — full width",
      render: () => <OperatorMap engines={engines} height={460} />,
    },
    actionQueue: {
      key: "actionQueue",
      label: "Action queue",
      subtitle: "Engines requiring portfolio team attention",
      render: () => <ActionQueue engines={engines} />,
    },
  };
}

function pickOptions(catalogue: Record<string, SlotOption>, keys: string[]): SlotOption[] {
  return keys.map((k) => catalogue[k]).filter((o): o is SlotOption => Boolean(o));
}
