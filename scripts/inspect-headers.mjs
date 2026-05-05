// V5/scripts/inspect-headers.mjs — dump actual column headers from each sheet
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const filePath = process.argv[2] ?? "C:/Users/Rutishkrishna/Desktop/RR/RR Forecasting/V4/ExcelV4/Lessor_SV_Tracker_Filled_V8.5_(1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });

const sheets = ["Engine SV Tracker", "Future Forecast", "Completed"];
for (const name of sheets) {
  const ws = wb.Sheets[name];
  if (!ws) { console.log(`(missing: ${name})`); continue; }
  const ref = ws["!ref"] ?? "A1";
  const range = XLSX.utils.decode_range(ref);
  console.log(`\n=== "${name}" (rows ${range.s.r + 1}–${range.e.r + 1}, cols A–${XLSX.utils.encode_col(range.e.c)}) ===`);
  // Try first few rows to find the header row (looks for row containing "lessor" or "esn")
  for (let r = 0; r <= Math.min(8, range.e.r); r++) {
    const cols = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      cols.push(String(cell?.v ?? "").trim().slice(0, 40));
    }
    const isLikelyHeader = cols.some((s) => /lessor|esn|engine|operator/i.test(s));
    console.log(`row ${r + 1}${isLikelyHeader ? " ← header?" : ""}:`);
    cols.forEach((v, i) => {
      if (v) console.log(`  ${XLSX.utils.encode_col(i)}: ${v}`);
    });
    if (isLikelyHeader) break;
  }
  // Show one full data row after header
  for (let r = 0; r <= range.e.r; r++) {
    const cols = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      cols.push(String(cell?.v ?? "").trim());
    }
    if (cols.some((s) => /lessor|esn/i.test(s))) {
      // Found header. Show row r+1 if it has content
      if (r + 1 <= range.e.r) {
        console.log(`\n  --- sample data row ${r + 2} ---`);
        for (let c = 0; c <= range.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c })];
          const v = cell?.v;
          if (v != null && v !== "") {
            const headerCell = ws[XLSX.utils.encode_cell({ r, c })];
            console.log(`  ${XLSX.utils.encode_col(c)} (${String(headerCell?.v ?? "").slice(0,30)}): ${JSON.stringify(v)}${cell.t ? ` [type=${cell.t}]` : ""}`);
          }
        }
      }
      break;
    }
  }
}
