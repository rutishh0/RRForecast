// V5/src/components/beta/data/Table.tsx — table primitives
import { cn } from "@/src/lib/utils";
import type { ReactNode } from "react";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto scroll-thin", className)}>
      <table className="w-full text-[12.5px] tabular-nums border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-muted">{children}</thead>;
}

export function TR({
  children,
  hover = true,
  className,
}: {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}) {
  return <tr className={cn(hover && "hover:bg-surface-muted transition-colors", className)}>{children}</tr>;
}

export function TH({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "label-tiny font-medium px-3 h-8 border-b border-border whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  align = "left",
  className,
  mono = false,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 h-9 border-b border-border whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function CellBar({
  value,
  max = 1,
  tone = "neutral",
  width = 80,
  color,
}: {
  value: number;
  max?: number;
  tone?: "neutral" | "healthy" | "warning" | "critical";
  width?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const toneClass =
    tone === "healthy"
      ? "bg-status-healthy"
      : tone === "warning"
        ? "bg-status-warning"
        : tone === "critical"
          ? "bg-status-critical"
          : "bg-brand";
  return (
    <div className="inline-block align-middle h-1.5 rounded-full bg-border-strong/30 overflow-hidden" style={{ width }}>
      <div
        className={color ? "h-full" : cn("h-full", toneClass)}
        style={{ width: `${pct * 100}%`, background: color }}
      />
    </div>
  );
}
