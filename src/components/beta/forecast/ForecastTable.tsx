// V5/src/components/beta/forecast/ForecastTable.tsx
import { Link } from "react-router-dom";
import type { EngineRecord } from "@/src/lib/beta/types";
import { formatDate, formatUSD, formatPct, daysUntil } from "@/src/lib/beta/format";
import { Table, THead, TR, TH, TD, CellBar } from "@/src/components/beta/data/Table";

export function ForecastTable({ engines }: { engines: EngineRecord[] }) {
  const sorted = [...engines]
    .filter((e) => e.removalDate ?? e.transitionDate ?? e.leaseExpiry)
    .sort((a, b) => {
      const da = a.removalDate ?? a.transitionDate ?? a.leaseExpiry ?? "9999";
      const db = b.removalDate ?? b.transitionDate ?? b.leaseExpiry ?? "9999";
      return da.localeCompare(db);
    });

  return (
    <Table>
      <THead>
        <TR hover={false}>
          <TH>ESN</TH>
          <TH>Engine</TH>
          <TH>Operator</TH>
          <TH>Lessor</TH>
          <TH>Reason</TH>
          <TH align="right">Removal</TH>
          <TH align="right">In</TH>
          <TH align="right">SV likelihood</TH>
          <TH align="right">List value</TH>
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
  );
}
