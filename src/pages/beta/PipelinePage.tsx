// V5/src/pages/beta/PipelinePage.tsx — kanban-style stage column board
import { useMemo } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import { toEngineRecords } from "@/src/lib/beta/adapters";
import { countByStage } from "@/src/lib/beta/aggregations";
import { aggregateFinancials } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import type { PipelineStage, EngineRecord } from "@/src/lib/beta/types";
import { PageShell } from "@/src/components/beta/PageShell";
import { Metric, MetricStrip } from "@/src/components/beta/data/Metric";
import { PipelineColumn } from "@/src/components/beta/pipeline/PipelineColumn";

const COLUMN_ORDER: PipelineStage[] = [
  "Requested",
  "Workscope Agreed",
  "In Shop",
  "Testing",
  "ARC",
  "On Hold",
];

export default function BetaPipelinePage() {
  const { shopVisits, forecasts } = useAppData();
  const engines = useMemo(
    () => toEngineRecords(shopVisits as never, forecasts as never),
    [shopVisits, forecasts],
  );

  const counts = useMemo(() => countByStage(engines), [engines]);
  const active = useMemo(
    () => engines.filter((e) => COLUMN_ORDER.includes(e.stage)),
    [engines],
  );
  const fin = useMemo(() => aggregateFinancials(active), [active]);
  const inShopOrLater =
    (counts["In Shop"] ?? 0) + (counts["Testing"] ?? 0) + (counts["ARC"] ?? 0);

  const grouped = useMemo(() => {
    const out: Record<PipelineStage, EngineRecord[]> = {} as Record<PipelineStage, EngineRecord[]>;
    for (const stage of COLUMN_ORDER) {
      out[stage] = engines
        .filter((e) => e.stage === stage)
        .sort((a, b) => {
          const da = a.removalDate ?? a.transitionDate ?? a.leaseExpiry ?? "9999";
          const db = b.removalDate ?? b.transitionDate ?? b.leaseExpiry ?? "9999";
          return da.localeCompare(db);
        });
    }
    return out;
  }, [engines]);

  if (engines.length === 0) {
    return (
      <PageShell title="Pipeline" description="Active shop visits across the LessorCare network.">
        <div className="rounded-lg border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[13px] text-muted-foreground">
            No engine data loaded yet. Upload a workbook to populate the pipeline.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pipeline"
      description="Active shop visits across the LessorCare network. Each card represents one engine; click for the engine-map view."
    >
      <MetricStrip>
        <Metric label="Active SVs" value={active.length} sub="Across all stages" />
        <Metric
          label="In shop or later"
          value={inShopOrLater}
          sub={`${counts["In Shop"] ?? 0} in shop · ${counts.Testing ?? 0} testing · ${counts.ARC ?? 0} ARC`}
        />
        <Metric label="Pipeline value" value={formatUSD(fin.revenue, true)} sub="At list price" />
        <Metric label="On hold" value={counts["On Hold"] ?? 0} sub="Requires resolution" />
      </MetricStrip>

      <div className="mt-4 flex gap-3 overflow-x-auto scroll-thin pb-2">
        {COLUMN_ORDER.map((stage) => (
          <PipelineColumn key={stage} stage={stage} engines={grouped[stage]} />
        ))}
      </div>
    </PageShell>
  );
}
