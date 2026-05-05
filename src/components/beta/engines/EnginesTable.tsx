// V5/src/components/beta/engines/EnginesTable.tsx
//
// Filterable engines table — replaces ShopVisitTracker in beta mode.
// Free-text search + family + stage filters; renders status pill, removal
// date, SV likelihood, list value.

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import type { EngineRecord, PipelineStage } from "@/src/lib/beta/types";
import { formatDate, formatUSD, formatPct } from "@/src/lib/beta/format";
import { Table, THead, TR, TH, TD } from "@/src/components/beta/data/Table";
import { StatusPill, type StatusTone } from "@/src/components/beta/data/Status";

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

export function EnginesTable({ engines }: { engines: EngineRecord[] }) {
  const [q, setQ] = useState("");
  const [family, setFamily] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");

  const families = useMemo(
    () => Array.from(new Set(engines.map((e) => e.engineType))).sort(),
    [engines],
  );
  const stages = useMemo(
    () => Array.from(new Set(engines.map((e) => e.stage))).sort(),
    [engines],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return engines.filter((e) => {
      if (family !== "all" && e.engineType !== family) return false;
      if (stage !== "all" && e.stage !== stage) return false;
      if (ql) {
        const hay = `${e.esn} ${e.msn ?? ""} ${e.operator} ${e.lessor} ${e.engineType}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [engines, q, family, stage]);

  return (
    <div className="bg-surface border border-border rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ESN, MSN, operator, lessor..."
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
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-8 px-2 bg-surface-muted border border-border rounded text-[12px] text-foreground focus:bg-surface focus:outline-none"
        >
          <option value="all">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="ml-auto text-[11.5px] text-muted-foreground tabular-nums">
          {filtered.length} of {engines.length}
        </span>
      </div>
      <Table>
        <THead>
          <TR hover={false}>
            <TH>ESN</TH>
            <TH>Engine</TH>
            <TH>Operator</TH>
            <TH>Lessor</TH>
            <TH>Stage</TH>
            <TH>SV type</TH>
            <TH align="right">Removal</TH>
            <TH align="right">SV likelihood</TH>
            <TH align="right">List value</TH>
          </TR>
        </THead>
        <tbody>
          {filtered.map((e) => (
            <TR key={e.esn}>
              <TD mono>
                <Link to={`/engine-map?esn=${encodeURIComponent(e.esn)}`} className="hover:underline font-medium text-brand">
                  {e.esn}
                </Link>
              </TD>
              <TD className="text-foreground">{e.engineType}</TD>
              <TD className="max-w-[180px] truncate text-muted-foreground">{e.operator}</TD>
              <TD className="max-w-[140px] truncate text-muted-foreground">{e.lessor}</TD>
              <TD>
                <StatusPill tone={STAGE_TONE[e.stage]}>{e.stage}</StatusPill>
              </TD>
              <TD className="text-muted-foreground">{e.svType ?? "—"}</TD>
              <TD align="right" mono className="text-foreground">
                {formatDate(e.removalDate ?? e.transitionDate ?? e.leaseExpiry)}
              </TD>
              <TD align="right" mono className="text-foreground">{formatPct(e.svProbability)}</TD>
              <TD align="right" mono className="text-foreground">{formatUSD(e.svPrice, true)}</TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
