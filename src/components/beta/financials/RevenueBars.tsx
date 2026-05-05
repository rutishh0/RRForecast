// V5/src/components/beta/financials/RevenueBars.tsx
import { revenueByYear } from "@/src/lib/beta/finance";
import type { EngineRecord } from "@/src/lib/beta/types";
import { formatUSD } from "@/src/lib/beta/format";

export function RevenueBars({ engines }: { engines: EngineRecord[] }) {
  const data = revenueByYear(engines).filter((d) => d.year >= new Date().getFullYear());
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="px-4 py-4">
      <div className="flex items-end gap-3 h-[200px]">
        {data.map((d) => {
          const h = (d.value / max) * 100;
          return (
            <div key={d.year} className="flex-1 flex flex-col items-stretch min-w-0">
              <div className="flex-1 relative">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-sm"
                  style={{ height: `${h}%`, background: "var(--brand)" }}
                />
                <div
                  className="absolute left-0 right-0 text-center text-[10.5px] font-mono tabular-nums text-foreground"
                  style={{ bottom: `calc(${h}% + 4px)` }}
                >
                  {formatUSD(d.value, true)}
                </div>
              </div>
              <div className="text-center pt-1.5 mt-1.5 border-t border-border font-mono tabular-nums text-[11px] text-muted-foreground">
                {d.year}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
