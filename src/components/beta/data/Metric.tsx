// V5/src/components/beta/data/Metric.tsx — KPI tiles + HeroMetric
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/src/lib/utils";

export type MetricAccent = "blue" | "amber" | "teal" | "plum" | "ink" | "coral" | "sage";

const ACCENT_DOT: Record<MetricAccent, string> = {
  blue: "bg-brand",
  amber: "bg-[#d97706]",
  teal: "bg-[#0d9488]",
  plum: "bg-[#7c3aed]",
  ink: "bg-foreground",
  coral: "bg-[#e11d48]",
  sage: "bg-[#15803d]",
};

const ACCENT_TINT: Record<MetricAccent, string> = {
  blue: "from-brand-bg",
  amber: "from-[#fef3c7]",
  teal: "from-[#ccfbf1]",
  plum: "from-[#ede9fe]",
  ink: "from-surface-subtle",
  coral: "from-[#ffe4e6]",
  sage: "from-[#dcfce7]",
};

export function Metric({
  label,
  value,
  sub,
  trend,
  unit,
  hint,
  accent,
  tinted = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: { delta: number; suffix?: string; invert?: boolean };
  unit?: string;
  hint?: string;
  accent?: MetricAccent;
  tinted?: boolean;
}) {
  const positive = trend != null ? (trend.invert ? trend.delta < 0 : trend.delta > 0) : null;
  const Icon = trend && trend.delta >= 0 ? ArrowUp : ArrowDown;
  return (
    <div
      className={cn(
        "relative px-4 py-3.5 overflow-hidden",
        tinted && accent && `bg-gradient-to-br ${ACCENT_TINT[accent]} to-transparent`,
      )}
    >
      <div className="label-tiny mb-1.5 truncate flex items-center gap-1.5" title={label}>
        {accent && <span className={cn("size-1.5 rounded-full", ACCENT_DOT[accent])} />}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold tracking-tight tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[12px] text-muted-foreground tabular-nums leading-none">{unit}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-2 min-h-[14px]">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums leading-none px-1.5 h-[18px] rounded",
              positive
                ? "bg-status-healthy-bg text-status-healthy"
                : "bg-status-critical-bg text-status-critical",
            )}
          >
            <Icon className="size-3" />
            {Math.abs(trend.delta).toFixed(1)}
            {trend.suffix ?? "%"}
          </span>
        )}
        {sub && (
          <span className="text-[11px] text-muted-foreground tabular-nums leading-none truncate">{sub}</span>
        )}
      </div>
      {hint && <div className="mt-1 text-[10.5px] text-subtle-foreground">{hint}</div>}
    </div>
  );
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg grid divide-x divide-border grid-cols-2 md:grid-cols-4 shadow-sm">
      {children}
    </div>
  );
}

export function HeroMetric({
  label,
  value,
  sub,
  unit,
  variant = "blue",
  trend,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  unit?: string;
  variant?: "blue" | "amber" | "teal" | "plum" | "ink";
  trend?: { delta: number; suffix?: string; invert?: boolean };
}) {
  const heroClass = {
    blue: "hero-blue",
    amber: "hero-amber",
    teal: "hero-teal",
    plum: "hero-plum",
    ink: "hero-ink",
  }[variant];
  const positive = trend != null ? (trend.invert ? trend.delta < 0 : trend.delta > 0) : null;
  const Icon = trend && trend.delta >= 0 ? ArrowUp : ArrowDown;
  return (
    <div className={cn("rounded-lg p-5 shadow-md relative overflow-hidden", heroClass)}>
      <div className="text-[10px] tracking-[0.1em] uppercase font-semibold text-white/70 mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[32px] font-semibold tracking-tight tabular-nums leading-none">{value}</span>
        {unit && <span className="text-[14px] text-white/70 tabular-nums leading-none">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 min-h-[16px]">
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums leading-none px-1.5 h-[18px] rounded bg-white/20 text-white">
            <Icon className="size-3" />
            {Math.abs(trend.delta).toFixed(1)}
            {trend.suffix ?? "%"}
          </span>
        )}
        {sub && <span className="text-[11px] text-white/70 tabular-nums leading-none">{sub}</span>}
      </div>
      {/* render `positive` only to silence unused warning when no trend present */}
      {positive === false && null}
    </div>
  );
}
