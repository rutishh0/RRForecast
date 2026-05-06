// V5/src/components/beta/forecast/ForecastTable.tsx
//
// Filterable + sortable forecast table — picks engines that have any
// removal/transition/lease date and lets the user sort/search/filter
// across them. Default sort is removal-date ascending (the chronological
// view used to be hard-coded; useSort now drives it).

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { EngineRecord } from "@/src/lib/beta/types";
import { formatDate, formatUSD, formatPct, daysUntil } from "@/src/lib/beta/format";
import { Table, THead, TR, TD, CellBar, SortableTH } from "@/src/components/beta/data/Table";
import { useSort } from "@/src/lib/beta/use-sort";

type SortKey =
  | "esn"
  | "engineType"
  | "operator"
  | "lessor"
  | "svReason"
  | "removal"
  | "days"
  | "svProbability"
  | "svPrice";

export function ForecastTable({ engines }: { engines: EngineRecord[] }) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<string>("all");

  const families = useMemo(
    () => Array.from(new Set(engines.map((e) => e.engineType))).sort(),
    [engines],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return engines
      .filter((e) => e.removalDate ?? e.transitionDate ?? e.leaseExpiry)
      .filter((e) => {
        if (family !== "all" && e.engineType !== family) return false;
        if (ql) {
          const hay = `${e.esn} ${e.msn ?? ""} ${e.operator} ${e.lessor} ${e.engineType} ${e.svReason ?? ""}`.toLowerCase();
          if (!hay.includes(ql)) return false;
        }
        return true;
      });
  }, [engines, q, family]);

  const { sorted, toggleSort, dirFor } = useSort<EngineRecord, SortKey>(
    filtered,
    {
      esn: (e) => e.esn,
      engineType: (e) => e.engineType,
      operator: (e) => e.operator,
      lessor: (e) => e.lessor,
      svReason: (e) => e.svReason,
      removal: (e) => e.removalDate ?? e.transitionDate ?? e.leaseExpiry,
      days: (e) => daysUntil(e.removalDate ?? e.transitionDate ?? e.leaseExpiry),
      svProbability: (e) => e.svProbability,
      svPrice: (e) => e.svPrice,
    },
    { key: "removal", dir: "asc" },
  );

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ESN, operator, lessor, reason..."
            className="w-full h-8 pl-7 pr-3 bg-surface-muted border border-border rounded text-[12.5px] text-foreground focus:bg-surface focus:outline-none focus:border-foreground"
          />
        </div>
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          className="h-8 px-2 bg-surface-muted border border-border rounded text-[12px] text-foreground focus:bg-surface focus:outline-none"
        >
          <option value="all">All families</option>
          {families.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <span className="ml-auto text-[11.5px] text-muted-foreground tabular-nums">
          {sorted.length} engines
        </span>
      </div>
      <Table>
        <THead>
          <TR hover={false}>
            <SortableTH sortKey="esn" dir={dirFor("esn")} onToggle={toggleSort}>ESN</SortableTH>
            <SortableTH sortKey="engineType" dir={dirFor("engineType")} onToggle={toggleSort}>Engine</SortableTH>
            <SortableTH sortKey="operator" dir={dirFor("operator")} onToggle={toggleSort}>Operator</SortableTH>
            <SortableTH sortKey="lessor" dir={dirFor("lessor")} onToggle={toggleSort}>Lessor</SortableTH>
            <SortableTH sortKey="svReason" dir={dirFor("svReason")} onToggle={toggleSort}>Reason</SortableTH>
            <SortableTH sortKey="removal" dir={dirFor("removal")} onToggle={toggleSort} align="right">Removal</SortableTH>
            <SortableTH sortKey="days" dir={dirFor("days")} onToggle={toggleSort} align="right">In</SortableTH>
            <SortableTH sortKey="svProbability" dir={dirFor("svProbability")} onToggle={toggleSort} align="right">SV likelihood</SortableTH>
            <SortableTH sortKey="svPrice" dir={dirFor("svPrice")} onToggle={toggleSort} align="right">List value</SortableTH>
          </TR>
        </THead>
        <tbody>
          {sorted.map((e) => {
            const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
            const days = daysUntil(iso);
            const tone =
              days != null && days < 30
                ? "critical"
                : days != null && days < 90
                  ? "warning"
                  : days != null && days < 180
                    ? "info"
                    : "neutral";
            return (
              <TR key={e.esn}>
                <TD mono>
                  <Link to={`/engine-map?esn=${encodeURIComponent(e.esn)}`} className="hover:underline font-medium text-brand">
                    {e.esn}
                  </Link>
                </TD>
                <TD className="text-foreground">{e.engineType}</TD>
                <TD className="max-w-[180px] truncate text-foreground">{e.operator}</TD>
                <TD className="text-muted-foreground max-w-[140px] truncate">{e.lessor}</TD>
                <TD className="text-muted-foreground">{e.svReason ?? "—"}</TD>
                <TD align="right" mono className="text-foreground">{formatDate(iso)}</TD>
                <TD align="right" mono>
                  <span
                    className={
                      tone === "critical"
                        ? "text-status-critical"
                        : tone === "warning"
                          ? "text-status-warning"
                          : tone === "info"
                            ? "text-status-info"
                            : "text-muted-foreground"
                    }
                  >
                    {days != null ? `${days}d` : "—"}
                  </span>
                </TD>
                <TD align="right" mono>
                  <span className="inline-flex items-center gap-2">
                    <CellBar
                      value={e.svProbability ?? 0}
                      max={100}
                      width={56}
                      tone={(e.svProbability ?? 0) >= 80 ? "healthy" : (e.svProbability ?? 0) >= 50 ? "warning" : "neutral"}
                    />
                    <span className="w-9 text-right text-foreground">{formatPct(e.svProbability)}</span>
                  </span>
                </TD>
                <TD align="right" mono className="text-foreground">{formatUSD(e.svPrice, true)}</TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
