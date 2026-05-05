// V5/src/lib/beta/format.ts — formatting + small helpers for beta UI

import type { EngineRecord, PipelineStage } from "./types";

export function formatDate(iso?: string, opts: { month?: "short" | "long" | "numeric" } = {}): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: opts.month ?? "short",
    year: "numeric",
  });
}

export function formatMonthYear(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function formatUSD(n?: number, compact = false): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
}

export function formatPct(n?: number): string {
  if (n == null) return "—";
  return `${Math.round(n)}%`;
}

export function daysUntil(iso?: string, from = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function quarterOf(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

export const STAGE_TONE: Record<PipelineStage, "neutral" | "info" | "warn" | "success" | "danger" | "gold"> = {
  Forecasted: "neutral",
  Requested: "info",
  "Workscope Agreed": "info",
  "In Shop": "warn",
  Testing: "warn",
  ARC: "gold",
  Complete: "success",
  Cancelled: "danger",
  "On Hold": "danger",
};

export const STAGE_ORDER: PipelineStage[] = [
  "Forecasted",
  "Requested",
  "Workscope Agreed",
  "In Shop",
  "Testing",
  "ARC",
  "Complete",
  "Cancelled",
  "On Hold",
];

export function isActivePipeline(e: EngineRecord): boolean {
  return e.stage !== "Forecasted" && e.stage !== "Complete";
}

export function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function byDateAsc(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a).getTime() - new Date(b).getTime();
}
