// V5/src/components/beta/financials/LessorTable.tsx
import type { EngineRecord } from "@/src/lib/beta/types";
import { financialsBy } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { Table, THead, TR, TD, CellBar, SortableTH } from "@/src/components/beta/data/Table";
import { useSort } from "@/src/lib/beta/use-sort";

type SortKey = "name" | "count" | "revenue" | "profit" | "margin" | "cashOut";

export function LessorTable({ engines }: { engines: EngineRecord[] }) {
  const rows = financialsBy(engines, "lessor");
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  const { sorted, toggleSort, dirFor } = useSort<typeof rows[number], SortKey>(
    rows,
    {
      name: (r) => r.name,
      count: (r) => r.count,
      revenue: (r) => r.revenue,
      profit: (r) => r.profit,
      margin: (r) => r.marginPct,
      cashOut: (r) => r.cashOutWeighted,
    },
    { key: "revenue", dir: "desc" },
  );

  return (
    <Table>
      <THead>
        <TR hover={false}>
          <SortableTH sortKey="name" dir={dirFor("name")} onToggle={toggleSort}>Lessor</SortableTH>
          <SortableTH sortKey="count" dir={dirFor("count")} onToggle={toggleSort} align="right">Engines</SortableTH>
          <SortableTH sortKey="revenue" dir={dirFor("revenue")} onToggle={toggleSort} align="right">Revenue</SortableTH>
          <SortableTH sortKey="profit" dir={dirFor("profit")} onToggle={toggleSort} align="right">Profit</SortableTH>
          <SortableTH sortKey="margin" dir={dirFor("margin")} onToggle={toggleSort} align="right">Margin</SortableTH>
          <SortableTH sortKey="cashOut" dir={dirFor("cashOut")} onToggle={toggleSort} align="right">Cash-out exposure</SortableTH>
        </TR>
      </THead>
      <tbody>
        {sorted.map((r) => (
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
