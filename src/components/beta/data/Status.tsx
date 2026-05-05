// V5/src/components/beta/data/Status.tsx
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export type StatusTone = "healthy" | "info" | "warning" | "critical" | "neutral";

const TONE_CLASSES: Record<StatusTone, { dot: string; pill: string; text: string }> = {
  healthy: { dot: "bg-status-healthy", pill: "bg-status-healthy-bg text-status-healthy", text: "text-status-healthy" },
  info: { dot: "bg-status-info", pill: "bg-status-info-bg text-status-info", text: "text-status-info" },
  warning: { dot: "bg-status-warning", pill: "bg-status-warning-bg text-status-warning", text: "text-status-warning" },
  critical: { dot: "bg-status-critical", pill: "bg-status-critical-bg text-status-critical", text: "text-status-critical" },
  neutral: { dot: "bg-status-neutral", pill: "bg-status-neutral-bg text-status-neutral", text: "text-status-neutral" },
};

export function StatusDot({ tone = "neutral", pulse = false, className }: { tone?: StatusTone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("inline-block size-1.5 rounded-full shrink-0", TONE_CLASSES[tone].dot, pulse && "animate-pulse", className)} />
  );
}

export function StatusPill({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10.5px] font-medium tracking-tight", TONE_CLASSES[tone].pill)}>
      <span className={cn("size-1.5 rounded-full", TONE_CLASSES[tone].dot)} />
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 h-5 rounded text-[10.5px] font-mono uppercase tracking-tight bg-surface-subtle text-muted-foreground border border-border">
      {children}
    </span>
  );
}
