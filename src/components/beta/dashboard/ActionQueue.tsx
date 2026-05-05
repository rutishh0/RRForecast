// V5/src/components/beta/dashboard/ActionQueue.tsx
import { Link } from "react-router-dom";
import type { EngineRecord } from "@/src/lib/beta/types";
import { daysUntil, formatDate } from "@/src/lib/beta/format";
import { StatusDot, type StatusTone } from "../data/Status";

interface ActionItem {
  esn: string;
  engine: EngineRecord;
  reason: string;
  date?: string;
  tone: StatusTone;
  priority: number;
}

function buildActions(engines: EngineRecord[]): ActionItem[] {
  const out: ActionItem[] = [];
  for (const e of engines) {
    if (e.stage === "On Hold") {
      out.push({ esn: e.esn, engine: e, reason: "Pipeline on hold", date: e.lastUpdated, tone: "critical", priority: 100 });
    }
    const lease = daysUntil(e.leaseExpiry);
    if (lease != null && lease >= 0 && lease <= 90 && e.stage === "Forecasted") {
      out.push({
        esn: e.esn,
        engine: e,
        reason: `Lease ends in ${lease}d, no SV scheduled`,
        date: e.leaseExpiry,
        tone: "critical",
        priority: 90 - lease / 4,
      });
    }
    const removal = daysUntil(e.removalDate);
    if (removal != null && removal >= 0 && removal <= 30 && e.stage === "Forecasted") {
      out.push({
        esn: e.esn,
        engine: e,
        reason: `Removal in ${removal}d, awaiting workscope`,
        date: e.removalDate,
        tone: "warning",
        priority: 80 - removal,
      });
    }
    if (
      (e.svProbability ?? 0) >= 80 &&
      e.stage === "Forecasted" &&
      removal != null &&
      removal > 30 &&
      removal < 180
    ) {
      out.push({
        esn: e.esn,
        engine: e,
        reason: `${Math.round(e.svProbability ?? 0)}% SV likelihood, plan workscope`,
        date: e.removalDate,
        tone: "info",
        priority: 50,
      });
    }
  }
  const map = new Map<string, ActionItem>();
  for (const a of out) {
    const cur = map.get(a.esn);
    if (!cur || a.priority > cur.priority) map.set(a.esn, a);
  }
  return Array.from(map.values()).sort((a, b) => b.priority - a.priority);
}

export function ActionQueue({ engines }: { engines: EngineRecord[] }) {
  const items = buildActions(engines).slice(0, 8);
  return (
    <ul className="divide-y divide-border">
      {items.length === 0 && (
        <li className="px-4 py-6 text-[12px] text-muted-foreground text-center">
          Nothing requires attention right now.
        </li>
      )}
      {items.map((item) => (
        <li key={item.esn}>
          <Link
            to={`/engine-map?esn=${encodeURIComponent(item.esn)}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-muted transition-colors"
          >
            <StatusDot tone={item.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12.5px] leading-tight">
                <span className="font-mono font-medium tabular-nums">ESN {item.esn}</span>
                <span className="text-muted-foreground truncate">
                  · {item.engine.engineType} · {item.engine.operator}
                </span>
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">{item.reason}</div>
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">{formatDate(item.date)}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
