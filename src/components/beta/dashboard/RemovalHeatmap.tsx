// V5/src/components/beta/dashboard/RemovalHeatmap.tsx
import type { EngineRecord, EngineFamily } from "@/src/lib/beta/types";
import { CAT } from "@/src/lib/beta/chart-theme";

const FAMILIES: EngineFamily[] = ["Trent 700", "Trent 900", "Trent 1000", "Trent 7000", "Trent XWB-84", "Trent XWB-97"];
const FALLBACK = "#64748b";

function makeMonths(count: number): { iso: string; label: string; year: number }[] {
  const out = [];
  const now = new Date();
  now.setDate(1);
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.getFullYear(),
    });
  }
  return out;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function RemovalHeatmap({ engines }: { engines: EngineRecord[] }) {
  const months = makeMonths(24);
  const grid: Record<string, Record<string, number>> = {};
  for (const f of FAMILIES) {
    grid[f] = {};
    for (const m of months) grid[f][m.iso] = 0;
  }
  for (const e of engines) {
    const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (grid[e.engineType] && grid[e.engineType][key] != null) {
      grid[e.engineType][key] += 1;
    }
  }
  const max = Math.max(1, ...FAMILIES.flatMap((f) => Object.values(grid[f])));

  function cellColor(family: EngineFamily, count: number): string {
    if (count === 0) return "transparent";
    const intensity = Math.min(1, count / max);
    const [r, g, b] = hexToRgb(CAT[family] ?? FALLBACK);
    const alpha = 0.18 + intensity * 0.82;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }

  const yearBreaks = months.map((m, i) => i > 0 && months[i - 1].year !== m.year);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="overflow-x-auto scroll-thin">
        <table className="border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left label-tiny pr-3 align-bottom h-7" />
              {months.map((m, i) => (
                <th
                  key={m.iso}
                  className="label-tiny font-medium align-bottom px-0.5 pb-1 w-[26px]"
                  style={{ borderLeft: yearBreaks[i] ? "1px solid var(--border)" : undefined }}
                >
                  {(i % 3 === 0 || yearBreaks[i]) && (
                    <div className="font-mono normal-case tracking-tight">
                      {m.label}
                      {(yearBreaks[i] || i === 0) && <div className="text-subtle-foreground">{m.year}</div>}
                    </div>
                  )}
                </th>
              ))}
              <th className="label-tiny pl-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {FAMILIES.map((f) => {
              const total = Object.values(grid[f]).reduce((s, v) => s + v, 0);
              return (
                <tr key={f}>
                  <td className="text-[11.5px] pr-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm shrink-0" style={{ background: CAT[f] ?? FALLBACK }} />
                      <span className="text-foreground font-medium">{f}</span>
                    </span>
                  </td>
                  {months.map((m, i) => {
                    const c = grid[f][m.iso];
                    return (
                      <td
                        key={m.iso}
                        className="p-0.5"
                        style={{ borderLeft: yearBreaks[i] ? "1px solid var(--border)" : undefined }}
                      >
                        <div
                          className="h-6 rounded-sm flex items-center justify-center text-[10px] font-mono tabular-nums font-semibold"
                          style={{
                            background: cellColor(f, c),
                            color: c / max > 0.55 ? "white" : "var(--foreground)",
                          }}
                          title={`${f} · ${m.label} ${m.year} · ${c}`}
                        >
                          {c > 0 ? c : ""}
                        </div>
                      </td>
                    );
                  })}
                  <td className="font-mono tabular-nums text-[11.5px] pl-3 text-right">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
