// V5/src/lib/beta/finance.ts — derived financial metrics
import type { EngineRecord, EngineFamily } from "./types";

const FAMILY_BASE_PRICE: Record<EngineFamily, number> = {
  "Trent 700": 9_500_000,
  "Trent 900": 12_500_000,
  "Trent 1000": 13_500_000,
  "Trent 7000": 13_500_000,
  "Trent XWB-84": 16_500_000,
  "Trent XWB-97": 19_500_000,
};

const BASE_MARGIN_PCT: Record<EngineFamily, number> = {
  "Trent 700": 18,
  "Trent 900": 17,
  "Trent 1000": 21,
  "Trent 7000": 22,
  "Trent XWB-84": 24,
  "Trent XWB-97": 25,
};

function stageConfidence(stage: EngineRecord["stage"]): number {
  switch (stage) {
    case "Forecasted": return 0.65;
    case "Requested": return 0.85;
    case "Workscope Agreed": return 0.95;
    case "In Shop":
    case "Testing":
    case "ARC": return 1;
    case "Complete": return 1;
    case "On Hold": return 0.4;
    case "Cancelled": return 0;
  }
}

export interface DerivedFinancials {
  revenue: number;
  contribution: number;
  profit: number;
  marginPct: number;
  cashOutProbability: number;
  cashOutWeighted: number;
}

// Default base price for engine families not in FAMILY_BASE_PRICE (e.g., minor
// typos in source data, future families not yet catalogued). Roughly the
// midpoint of the known Trent range so aggregate sums stay sensible.
const DEFAULT_BASE_PRICE = 13_000_000;

export function deriveFinancials(e: EngineRecord): DerivedFinancials {
  const familyPrice = FAMILY_BASE_PRICE[e.engineType] ?? DEFAULT_BASE_PRICE;
  const baseRevenue = e.svPrice ?? familyPrice * stageConfidence(e.stage);
  const marginPct = BASE_MARGIN_PCT[e.engineType] ?? 18;
  const contribution = e.svContribution ?? Math.round(baseRevenue * (marginPct / 100));
  const profit = contribution * 0.55;
  const realisedMargin = baseRevenue ? (profit / baseRevenue) * 100 : 0;

  let cashOutProb = 0;
  if (e.cashOutEligible) {
    cashOutProb = e.cashOutProbability ?? 60;
  } else if (e.leaseExpiry) {
    const monthsToExpiry = (new Date(e.leaseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsToExpiry > 0 && monthsToExpiry < 30) {
      const transitionRisk = 100 - (e.transitionProbability ?? 80);
      cashOutProb = Math.min(70, Math.round(transitionRisk * 0.6));
    }
  }
  const cashOutWeighted = (baseRevenue * cashOutProb) / 100;

  return {
    revenue: Math.round(baseRevenue),
    contribution: Math.round(contribution),
    profit: Math.round(profit),
    marginPct: Math.round(realisedMargin * 10) / 10,
    cashOutProbability: cashOutProb,
    cashOutWeighted: Math.round(cashOutWeighted),
  };
}

export function aggregateFinancials(records: EngineRecord[]) {
  let revenue = 0, contribution = 0, profit = 0, cashOutWeighted = 0, cashOutGross = 0, cashOutCount = 0;
  for (const e of records) {
    const f = deriveFinancials(e);
    revenue += f.revenue;
    contribution += f.contribution;
    profit += f.profit;
    cashOutWeighted += f.cashOutWeighted;
    if (f.cashOutProbability > 0) {
      cashOutGross += f.revenue;
      cashOutCount += 1;
    }
  }
  const marginPct = revenue ? (profit / revenue) * 100 : 0;
  return { revenue, contribution, profit, marginPct, cashOutWeighted, cashOutGross, cashOutCount };
}

export function financialsBy<K extends keyof EngineRecord>(records: EngineRecord[], key: K) {
  const map = new Map<string, EngineRecord[]>();
  for (const e of records) {
    const k = String(e[key] ?? "—");
    const list = map.get(k) ?? [];
    list.push(e);
    map.set(k, list);
  }
  return Array.from(map.entries()).map(([name, engines]) => ({
    name,
    count: engines.length,
    ...aggregateFinancials(engines),
  }));
}

export function revenueByYear(records: EngineRecord[]) {
  const buckets = new Map<number, number>();
  for (const e of records) {
    const iso = e.removalDate ?? e.transitionDate ?? e.leaseExpiry;
    if (!iso) continue;
    const y = new Date(iso).getFullYear();
    if (Number.isNaN(y)) continue;
    const f = deriveFinancials(e);
    buckets.set(y, (buckets.get(y) ?? 0) + f.revenue);
  }
  return Array.from(buckets.entries())
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year - b.year);
}
