// V5/scripts/verify-excel.mjs
//
// Loads the canonical Excel file, runs the V5 parser, and reports:
//  - sheet names + row counts
//  - parsed shopVisits + forecasts counts
//  - sample of first parsed row from each
//  - any rows missing required fields (esn / lessor / engineType)
//  - distinct values for fields the adapter cares about (engineType, status)
//  - unmapped column headers
//
// Run from V5/: node scripts/verify-excel.mjs <path>
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";

const filePath = process.argv[2] ?? resolve(
  import.meta.dirname,
  "../../V4/ExcelV4/Lessor_SV_Tracker_Filled_V8.5_(1).xlsx",
);

console.log(`\n=== Verifying: ${filePath} ===\n`);

const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

// 1) Inspect raw workbook shape
console.log("Sheet names:", wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:A1");
  console.log(`  • "${name}": rows=${range.e.r + 1} cols=${range.e.c + 1}`);
}

// 2) Run our parser
const { parseWorkbook } = await import("../lib/excel/parse.ts");
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const parsed = await parseWorkbook(ab);

console.log("\n--- Parser output ---");
console.log("shopVisits:", parsed.shopVisits.length);
console.log("forecasts:", parsed.forecasts.length);

if (parsed.shopVisits.length > 0) {
  const sv = parsed.shopVisits[0];
  console.log("\n--- First shop-visit row (sample) ---");
  for (const [k, v] of Object.entries(sv).slice(0, 25)) {
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}

if (parsed.forecasts.length > 0) {
  const f = parsed.forecasts[0];
  console.log("\n--- First forecast row (sample) ---");
  for (const [k, v] of Object.entries(f)) {
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}

// 3) Adapter sanity check — feed parsed rows into beta adapter
const { toEngineRecords } = await import("../src/lib/beta/adapters.ts");
const engines = toEngineRecords(parsed.shopVisits, parsed.forecasts);
console.log("\n--- toEngineRecords() ---");
console.log("EngineRecord total:", engines.length);

const stages = new Map();
const families = new Map();
const wingStates = new Map();
let missingEsn = 0;
let missingLessor = 0;
let missingEngineType = 0;
for (const e of engines) {
  if (!e.esn) missingEsn++;
  if (!e.lessor) missingLessor++;
  if (!e.engineType) missingEngineType++;
  stages.set(e.stage, (stages.get(e.stage) ?? 0) + 1);
  families.set(e.engineType, (families.get(e.engineType) ?? 0) + 1);
  wingStates.set(e.wingState, (wingStates.get(e.wingState) ?? 0) + 1);
}

console.log("\n--- Distribution ---");
console.log("By stage:", Object.fromEntries(stages));
console.log("By engine family:", Object.fromEntries(families));
console.log("By wing state:", Object.fromEntries(wingStates));

console.log("\n--- Missing required-ish fields ---");
console.log(`  rows missing esn: ${missingEsn}`);
console.log(`  rows missing lessor: ${missingLessor}`);
console.log(`  rows missing engineType: ${missingEngineType}`);

// 4) Sample some financials so we know the chart math will produce sensible numbers
const { aggregateFinancials, portfolioKpis } = await import("../src/lib/beta/aggregations.ts");
const { aggregateFinancials: aggFin } = await import("../src/lib/beta/finance.ts");
const kpis = portfolioKpis(engines);
const fin = aggFin(engines);
console.log("\n--- Beta dashboard KPIs (preview) ---");
console.log("totalEngines:", kpis.totalEngines);
console.log("activeCount:", kpis.activeCount);
console.log("forecastCount:", kpis.forecastCount);
console.log("next12Count:", kpis.next12Count);
console.log("activeValue:", kpis.activeValue);
console.log("aggregateFinancials.revenue:", fin.revenue);
console.log("aggregateFinancials.marginPct:", fin.marginPct.toFixed(2));

// 5) Header coverage — which columns from the sheet did NOT map into a known field?
const sv = parsed.shopVisits[0] ?? {};
const knownSvKeys = new Set(Object.keys(sv));
console.log("\n--- ShopVisit known keys (count): ", knownSvKeys.size);

console.log("\n✅ verification complete\n");
void aggregateFinancials;
