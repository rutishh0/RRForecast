// V5/src/lib/beta/adapters.ts
//
// Convert V5's ShopVisitRecord + ForecastRecord (from the Excel parser) into
// the unified EngineRecord shape that beta dashboard / pipeline / forecast
// components consume. V5 stores active SVs and forecasts as separate row
// types; beta expects them merged with a `stage` field distinguishing them.

import type { ShopVisitRecord, ForecastRecord } from "@/lib/excel/parse";
import type {
  EngineRecord,
  EngineFamily,
  WingState,
  PipelineStage,
  SVType,
  SVReason,
  ContractType,
  Priority,
} from "./types";

const PARSE_NUM_RE = /[^0-9.\-]/g;

function parseNumber(v: string | number | null | undefined): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;
  const cleaned = v.replace(PARSE_NUM_RE, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseBoolish(v: string | null | undefined): boolean | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return undefined;
}

function asWingState(v: string | undefined): WingState {
  const s = (v ?? "").trim();
  if (s === "On-Wing" || s === "On Wing") return "On-Wing";
  if (s === "Off-Wing" || s === "Off Wing") return "Off-Wing";
  if (s === "In Storage" || s === "Storage") return "In Storage";
  if (s === "Inducted") return "Inducted";
  return "On-Wing"; // default — beta charts only key on this for tone
}

/**
 * V5's `status` column has values like "Workscope Agreed", "In Shop", "Testing",
 * "ARC Released", "Complete", "On Hold" etc. Map liberally to beta PipelineStage.
 */
function asStage(status: string | undefined): PipelineStage {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return "Requested";
  if (s.includes("forecast")) return "Forecasted";
  if (s.includes("workscope")) return "Workscope Agreed";
  if (s.includes("test")) return "Testing";
  if (s.includes("arc")) return "ARC";
  if (s.includes("complete") || s.includes("done")) return "Complete";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("hold")) return "On Hold";
  if (s.includes("shop") || s.includes("induct")) return "In Shop";
  if (s.includes("request")) return "Requested";
  return "Requested";
}

function asContractType(v: string | undefined): ContractType | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  const allowed: ContractType[] = ["TCA", "LessorCare", "ERS", "C&R", "T&M", "OPERA", "None"];
  return (allowed as string[]).includes(s) ? (s as ContractType) : undefined;
}

function asPriority(v: string | undefined): Priority | undefined {
  const n = parseNumber(v);
  if (n == null) return undefined;
  if (n >= 1 && n <= 4) return n as Priority;
  return undefined;
}

function asSVType(v: string | undefined): SVType | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  return s as SVType; // permissive — beta charts use it for grouping only
}

function asSVReason(v: string | undefined): SVReason | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  return s as SVReason;
}

function fromShopVisit(row: ShopVisitRecord): EngineRecord {
  return {
    esn: row.esn ?? "",
    msn: row.msn || undefined,
    registration: row.registration || undefined,
    aircraftType: row.aircraftType || undefined,
    engineType: (row.engineType || "Trent 1000") as EngineFamily,
    lessor: row.lessor ?? "",
    operator: row.operator ?? "",
    lessorCarePlus: parseBoolish(row.lessorCarePlus),
    leaseExpiry: row.leaseExpiry || undefined,
    transitionDate: row.transitionDate || undefined,
    transitionProbability: row.transitionProbability ?? undefined,
    wingState: asWingState(row.wingStatus),
    removalDate: row.removalDate || undefined,
    fcsRemaining: parseNumber(row.fcsRemaining),
    svProbability: row.svProbability ?? undefined,
    svType: asSVType(row.svType),
    svReason: asSVReason(row.svReason),
    stage: asStage(row.status),
    shop: row.shop || undefined,
    contractType: asContractType(row.contractType),
    svPrice: parseNumber(row.svPrice),
    svContribution: row.totalSvContribution ?? undefined,
    profit: parseNumber(row.profit),
    cashOutEligible: parseBoolish(row.cashOutEligible),
    cashOutProbability: row.cashOutProbability ?? undefined,
    amResponsible: row.amContact || undefined,
    taskOwner: row.taskOwner || undefined,
    priority: asPriority(row.priority),
    notes: row.comments || row.nextSteps || undefined,
    lastUpdated: row.lastUpdated || undefined,
  };
}

function fromForecast(row: ForecastRecord): EngineRecord {
  // profitMillion is in millions; beta's profit field is in raw USD
  const profitM = parseNumber(row.profitMillion);
  return {
    esn: row.esn ?? "",
    engineType: (row.engineType || "Trent 1000") as EngineFamily,
    lessor: row.lessor ?? "",
    operator: row.operator ?? "",
    lessorCarePlus: parseBoolish(row.lessorCarePlus),
    wingState: asWingState(row.wingStatus),
    removalDate: row.removalDate || undefined,
    svType: asSVType(row.svTypeNeeded),
    stage: "Forecasted",
    svPrice: parseNumber(row.svPrice),
    profit: profitM != null ? profitM * 1_000_000 : undefined,
    cashOutEligible: parseBoolish(row.cashOutEligible),
    priority: asPriority(row.priority),
    notes: [row.comment, row.notes].filter(Boolean).join(" — ") || undefined,
  };
}

/**
 * Combine V5's two-table view (active shop visits + forecasts) into a single
 * EngineRecord[] keyed by ESN. If the same ESN appears in both tables the
 * shop-visit row wins (it has more detail and a real stage).
 */
export function toEngineRecords(
  shopVisits: ShopVisitRecord[],
  forecasts: ForecastRecord[],
): EngineRecord[] {
  const byEsn = new Map<string, EngineRecord>();
  for (const f of forecasts) {
    const rec = fromForecast(f);
    if (rec.esn) byEsn.set(rec.esn, rec);
  }
  for (const sv of shopVisits) {
    const rec = fromShopVisit(sv);
    if (rec.esn) byEsn.set(rec.esn, rec); // overwrite forecast with active SV
  }
  return [...byEsn.values()];
}
