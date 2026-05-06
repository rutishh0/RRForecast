// V5/src/components/beta/financials/FamilyTable.tsx
import type { EngineRecord, EngineFamily } from "@/src/lib/beta/types";
import { financialsBy } from "@/src/lib/beta/finance";
import { formatUSD } from "@/src/lib/beta/format";
import { Table, THead, TR, TD, CellBar, SortableTH } from "@/src/components/beta/data/Table";
import { CAT } from "@/src/lib/beta/chart-theme";
import { useSort } from "@/src/lib/beta/use-sort";

const FALLBACK = "#475569";

type SortKey = "name" | "count" | "revenue" | "avg" | "margin";

export function FamilyTable({ engines }: { engines: EngineRecord[] }) {
  const rows = financialsBy(engines, "engineType");
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  const { sorted, toggleSort, dirFor } = useSort<typeof rows[number], SortKey>(
    rows,
    {
      name: (r) => r.name,
      count: (r) => r.count,
      revenue: (r) => r.revenue,
      avg: (r) => (r.count ? r.revenue / r.count : 0),
      margin: (r) => r.marginPct,
    },
    { key: "revenue", dir: "desc" },
  );

  return (
    <Table>
      <THead>
        <TR hover={false}>
          <SortableTH sortKey="name" dir={dirFor("name")} onToggle={toggleSort}>Engine family</SortableTH>
          <SortableTH sortKey="count" dir={dirFor("count")} onToggle={toggleSort} align="right">Engines</SortableTH>
          <SortableTH sortKey="revenue" dir={dirFor("revenue")} onToggle={toggleSort} align="right">Revenue</SortableTH>
          <SortableTH sortKey="avg" dir={dirFor("avg")} onToggle={toggleSort} align="right">Avg ticket</SortableTH>
          <SortableTH sortKey="margin" dir={dirFor("margin")} onToggle={toggleSort} align="right">Margin</SortableTH>
        </TR>
      </THead>
      <tbody>
        {sorted.map((r) => (
          <TR key={r.name}>
            <TD className="text-foreground">
              <span className="inline-flex items-center gap-2.5">
                <CellBar value={r.revenue} max={maxRev} width={60} color={CAT[r.name as EngineFamily] ?? FALLBACK} />
                <span>{r.name}</span>
              </span>
            </TD>
            <TD align="right" mono className="text-foreground">{r.count}</TD>
            <TD align="right" mono className="font-medium text-foreground">{formatUSD(r.revenue, true)}</TD>
            <TD align="right" mono className="text-foreground">{formatUSD(r.count ? r.revenue / r.count : 0, true)}</TD>
            <TD align="right" mono className="text-foreground">{r.marginPct.toFixed(1)}%</TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
