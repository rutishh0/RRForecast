// V5/src/components/beta/financials/LessorTable.tsx
import type { EngineRecord } from "@/src/lib/beta/types";
import { financialsBy } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { Table, THead, TR, TH, TD, CellBar } from "@/src/components/beta/data/Table";

export function LessorTable({ engines }: { engines: EngineRecord[] }) {
  const rows = financialsBy(engines, "lessor").sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <Table>
      <THead>
        <TR hover={false}>
          <TH>Lessor</TH>
          <TH align="right">Engines</TH>
          <TH align="right">Revenue</TH>
          <TH align="right">Profit</TH>
          <TH align="right">Margin</TH>
          <TH align="right">Cash-out exposure</TH>
        </TR>
      </THead>
      <tbody>
        {rows.map((r) => (
          <TR key={r.name}>
            <TD className="text-foreground">
              <span className="inline-flex items-center gap-2.5">
                <CellBar value={r.revenue} max={maxRev} width={60} />
                <span className="truncate max-w-[200px]">{r.name}</span>
              </span>
            </TD>
            <TD align="right" mono className="text-foreground">{r.count}</TD>
            <TD align="right" mono className="font-medium text-foreground">{formatUSD(r.revenue, true)}</TD>
            <TD align="right" mono className="text-foreground">{formatUSD(r.profit, true)}</TD>
            <TD align="right" mono className="text-foreground">{r.marginPct.toFixed(1)}%</TD>
            <TD align="right" mono className="text-status-warning">
              {r.cashOutWeighted > 0 ? formatUSD(r.cashOutWeighted, true) : "—"}
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
