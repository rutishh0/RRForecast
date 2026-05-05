// V5/src/components/beta/charts/Donut.tsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function Donut({
  data,
  height = 220,
  centerValue,
  centerLabel,
  valueFormatter = (n) => `${n}`,
}: {
  data: DonutSlice[];
  height?: number;
  centerValue: string;
  centerLabel: string;
  valueFormatter?: (n: number) => string;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={1} stroke="var(--card)" strokeWidth={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, padding: "6px 8px" }}
            itemStyle={{ padding: 0 }}
            formatter={((value: unknown, name: unknown) => [valueFormatter(Number(value ?? 0)), String(name ?? "")]) as never}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{centerValue}</div>
        <div className="label-tiny mt-0.5">{centerLabel}</div>
      </div>
    </div>
  );
}
