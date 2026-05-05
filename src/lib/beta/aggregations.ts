// V5/src/lib/beta/aggregations.ts — KPI / grouping helpers for beta charts
import type { EngineRecord, PipelineStage } from "./types";

export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  "Requested",
  "Workscope Agreed",
  "In Shop",
  "Testing",
  "ARC",
];

export function activeEngines(records: EngineRecord[]): EngineRecord[] {
  return records.filter((e) => ACTIVE_PIPELINE_STAGES.includes(e.stage));
}

export function forecastEngines(records: EngineRecord[]): EngineRecord[] {
  return records.filter((e) => e.stage === "Forecasted");
}

export function completedEngines(records: EngineRecord[]): EngineRecord[] {
  return records.filter((e) => e.stage === "Complete");
}

export function countByStage(records: EngineRecord[]): Record<PipelineStage, number> {
  const counts: Record<PipelineStage, number> = {
    Forecasted: 0,
    Requested: 0,
    "Workscope Agreed": 0,
    "In Shop": 0,
    Testing: 0,
    ARC: 0,
    Complete: 0,
    Cancelled: 0,
    "On Hold": 0,
  };
  for (const e of records) counts[e.stage] = (counts[e.stage] ?? 0) + 1;
  return counts;
}

export function removalsByYear(records: EngineRecord[]): { year: number; count: number; value: number }[] {
  const buckets = new Map<number, { count: number; value: number }>();
  for (const e of records) {
    const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
    if (!iso) continue;
    const y = new Date(iso).getFullYear();
    if (Number.isNaN(y)) continue;
    const cur = buckets.get(y) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += e.svPrice ?? 0;
    buckets.set(y, cur);
  }
  return [...buckets.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year - b.year);
}

export function removalsByQuarter(
  records: EngineRecord[],
  fromYear?: number,
  toYear?: number,
): { label: string; year: number; q: number; count: number; value: number }[] {
  const buckets = new Map<string, { year: number; q: number; count: number; value: number }>();
  for (const e of records) {
    const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
    if (!iso) continue;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getFullYear();
    if ((fromYear && y < fromYear) || (toYear && y > toYear)) continue;
    const q = Math.floor(d.getMonth() / 3) + 1;
    const key = `${y}-Q${q}`;
    const cur = buckets.get(key) ?? { year: y, q, count: 0, value: 0 };
    cur.count += 1;
    cur.value += e.svPrice ?? 0;
    buckets.set(key, cur);
  }
  return [...buckets.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => a.year - b.year || a.q - b.q);
}

export function groupCount<K extends keyof EngineRecord>(
  records: EngineRecord[],
  key: K,
): { name: string; count: number; value: number }[] {
  const map = new Map<string, { count: number; value: number }>();
  for (const e of records) {
    const k = String(e[key] ?? "—");
    const cur = map.get(k) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += e.svPrice ?? 0;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);
}

export function portfolioKpis(records: EngineRecord[]) {
  const active = activeEngines(records);
  const forecast = forecastEngines(records);
  const totalForecastValue = records.reduce((s, e) => s + (e.svPrice ?? 0), 0);
  const activeValue = active.reduce((s, e) => s + (e.svPrice ?? 0), 0);
  const totalContribution = records.reduce((s, e) => s + (e.svContribution ?? 0), 0);
  const cashOutEligible = records.filter((e) => e.cashOutEligible).length;

  const now = new Date();
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + 12);
  const next12 = records.filter((e) => {
    const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
    if (!iso) return false;
    const d = new Date(iso);
    return d >= now && d <= horizon;
  });

  return {
    totalEngines: records.length,
    activeCount: active.length,
    forecastCount: forecast.length,
    next12Count: next12.length,
    totalForecastValue,
    activeValue,
    totalContribution,
    cashOutEligible,
  };
}

export function distinctValues<K extends keyof EngineRecord>(records: EngineRecord[], key: K): string[] {
  const set = new Set<string>();
  for (const e of records) {
    const v = e[key];
    if (v != null) set.add(String(v));
  }
  return [...set].sort();
}
