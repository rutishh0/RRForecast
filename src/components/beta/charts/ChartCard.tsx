// V5/src/components/beta/charts/ChartCard.tsx
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function ChartCard({ title, subtitle, trailing, children, footer, className = "" }: ChartCardProps) {
  return (
    <section className={`flex flex-col rounded-lg border border-border bg-card overflow-hidden shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border bg-surface-muted/50">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
      </header>
      <div className="flex-1 px-2 py-3">{children}</div>
      {footer && (
        <footer className="px-5 py-2 border-t border-border bg-surface-muted text-[11px] text-muted-foreground">
          {footer}
        </footer>
      )}
    </section>
  );
}

export function LegendDots({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px] shrink-0" style={{ background: it.color }} aria-hidden />
          <span className="text-foreground">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
