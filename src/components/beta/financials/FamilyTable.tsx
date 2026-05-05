// V5/src/components/beta/financials/FamilyTable.tsx
import type { EngineRecord, EngineFamily } from "@/src/lib/beta/types";
import { financialsBy } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { Table, THead, TR, TH, TD, CellBar } from "@/src/components/beta/data/Table";
import { CAT } from "@/src/lib/beta/chart-theme";

const FALLBACK = "#475569";

export function FamilyTable({ engines }: { engines: EngineRecord[] }) {
  const rows = financialsBy(engines, "engineType").sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <Table>
      <THead>
        <TR hover={false}>
          <TH>Engine family</TH>
          <TH align="right">Engines</TH>
          <TH align="right">Revenue</TH>
          <TH align="right">Avg ticket</TH>
          <TH align="right">Margin</TH>
        </TR>
      </THead>
      <tbody>
        {rows.map((r) => (
          <TR key={r.name}>
            <TD className="text-foreground">
              <span className="inline-flex items-center gap-2.5">
                <CellBar value={r.revenue} max={maxRev} width={60} color={CAT[r.name as EngineFamily] ?? FALLBACK} />
                <span>{r.name}</span>
              </span>
            </TD>
            <TD align="right" mono className="text-foreground">{r.count}</TD>
            <TD align="right" mono className="font-medium text-foreground">{formatUSD(r.revenue, true)}</TD>
            <TD align="right" mono className="text-foreground">{formatUSD(r.revenue / r.count, true)}</TD>
            <TD align="right" mono className="text-foreground">{r.marginPct.toFixed(1)}%</TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
