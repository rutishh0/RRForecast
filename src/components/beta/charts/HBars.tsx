// V5/src/components/beta/charts/HBars.tsx — pure CSS horizontal-bar chart
interface HBarRow {
  name: string;
  value: number;
  rightValue?: string;
  color?: string;
}

interface HBarsProps {
  data: HBarRow[];
  formatter?: (n: number) => string;
  limit?: number;
  defaultColor?: string;
}

export function HBars({ data, formatter = (n) => `${n}`, limit, defaultColor = "#0e3a5f" }: HBarsProps) {
  const rows = limit ? data.slice(0, limit) : data;
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;

  return (
    <ul className="flex flex-col gap-1.5 px-3 py-1">
      {rows.map((r) => {
        const w = (r.value / max) * 100;
        return (
          <li key={r.name} className="flex items-center gap-3">
            <div className="w-32 shrink-0 truncate text-[11px] text-foreground" title={r.name}>{r.name}</div>
            <div className="flex-1 h-5 relative bg-surface-subtle rounded-[2px] overflow-hidden">
              <div className="absolute inset-y-0 left-0 transition-all" style={{ width: `${w}%`, background: r.color ?? defaultColor }} />
            </div>
            <div className="w-16 shrink-0 text-right tabular-nums text-[11px] text-foreground">{formatter(r.value)}</div>
            {r.rightValue && (
              <div className="w-16 shrink-0 text-right tabular-nums text-[11px] text-muted-foreground">{r.rightValue}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
