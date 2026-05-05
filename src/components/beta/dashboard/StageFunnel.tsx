// V5/src/components/beta/dashboard/StageFunnel.tsx
import { countByStage } from "@/src/lib/beta/aggregations";
import type { EngineRecord, PipelineStage } from "@/src/lib/beta/types";
import { STAGE_COLOR } from "@/src/lib/beta/chart-theme";

const ORDER: PipelineStage[] = [
  "Forecasted",
  "Requested",
  "Workscope Agreed",
  "In Shop",
  "Testing",
  "ARC",
  "Complete",
  "On Hold",
];

export function StageFunnel({ engines }: { engines: EngineRecord[] }) {
  const counts = countByStage(engines);
  const max = Math.max(...Object.values(counts), 1);
  return (
    <ul className="divide-y divide-border">
      {ORDER.map((stage) => {
        const n = counts[stage];
        const pct = (n / max) * 100;
        const color = STAGE_COLOR[stage];
        return (
          <li key={stage} className="flex items-center gap-3 px-4 h-9 text-[12.5px] hover:bg-surface-muted transition-colors">
            <span className="flex items-center gap-2 w-36 shrink-0 truncate">
              <span className="size-2 rounded-sm shrink-0" style={{ background: color }} />
              <span className="truncate text-foreground">{stage}</span>
            </span>
            <div className="flex-1 min-w-0 relative h-2 bg-surface-subtle rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)` }}
              />
            </div>
            <span className="font-mono tabular-nums text-foreground w-8 text-right shrink-0 font-semibold">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
