// V5/src/components/beta/pipeline/PipelineColumn.tsx
import { Link } from "react-router-dom";
import type { EngineRecord, PipelineStage } from "@/src/lib/beta/types";
import { formatDate, formatUSD, daysUntil } from "@/src/lib/beta/format";
import { StatusDot, type StatusTone } from "@/src/components/beta/data/Status";

const STAGE_TONE: Record<PipelineStage, StatusTone> = {
  Forecasted: "neutral",
  Requested: "info",
  "Workscope Agreed": "info",
  "In Shop": "warning",
  Testing: "warning",
  ARC: "info",
  Complete: "healthy",
  Cancelled: "critical",
  "On Hold": "critical",
};

export function PipelineColumn({ stage, engines }: { stage: PipelineStage; engines: EngineRecord[] }) {
  const tone = STAGE_TONE[stage];
  const value = engines.reduce((s, e) => s + (e.svPrice ?? 0), 0);
  return (
    <div className="bg-surface border border-border rounded-md flex flex-col min-w-[260px] flex-1">
      <header className="px-3 h-10 border-b border-border flex items-center gap-2">
        <StatusDot tone={tone} />
        <span className="text-[12.5px] font-medium text-foreground">{stage}</span>
        <span className="font-mono tabular-nums text-[11px] text-muted-foreground ml-auto">{engines.length}</span>
      </header>
      <div className="px-3 py-2 border-b border-border bg-surface-muted">
        <div className="text-[10.5px] text-muted-foreground label-tiny mb-0.5">Total value</div>
        <div className="text-[13px] font-mono tabular-nums font-medium text-foreground">
          {value > 0 ? formatUSD(value, true) : "—"}
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1.5 scroll-thin max-h-[640px]">
        {engines.length === 0 && (
          <li className="text-[11.5px] text-muted-foreground text-center py-6">No engines</li>
        )}
        {engines.map((e) => (
          <li key={e.esn}>
            <PipelineCard engine={e} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PipelineCard({ engine }: { engine: EngineRecord }) {
  const removalIso = engine.removalDate ?? engine.transitionDate ?? engine.leaseExpiry;
  const days = daysUntil(removalIso);
  let urgency: StatusTone = "neutral";
  if (days != null) {
    if (days < 0) urgency = "critical";
    else if (days < 30) urgency = "critical";
    else if (days < 90) urgency = "warning";
    else if (days < 180) urgency = "info";
  }
  return (
    <Link
      to={`/engine-map?esn=${encodeURIComponent(engine.esn)}`}
      className="block bg-surface-muted border border-border rounded-sm p-2.5 hover:border-border-strong transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-medium text-foreground">{engine.esn}</span>
        {engine.svType && (
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-tight">{engine.svType}</span>
        )}
      </div>
      <div className="text-[11.5px] text-foreground mt-1.5 leading-tight truncate">{engine.engineType}</div>
      <div className="text-[11px] text-muted-foreground leading-tight truncate">{engine.operator}</div>
      <div className="flex items-center justify-between mt-2 text-[10.5px] tabular-nums">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <StatusDot tone={urgency} />
          {removalIso ? formatDate(removalIso) : "—"}
        </div>
        <span className="font-mono text-foreground">{engine.svPrice ? formatUSD(engine.svPrice, true) : ""}</span>
      </div>
    </Link>
  );
}
