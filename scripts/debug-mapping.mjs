// Show what the parser's buildColMapping resolves to for the real headers
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const filePath = "C:/Users/Rutishkrishna/Desktop/RR/RR Forecasting/V4/ExcelV4/Lessor_SV_Tracker_Filled_V8.5_(1).xlsx";
const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });

const sheet = wb.Sheets["Engine SV Tracker"];
const ref = sheet["!ref"];
console.log("ref:", ref);
const range = XLSX.utils.decode_range(ref);

// Find header row
for (let r = 0; r <= 6; r++) {
  console.log(`\nrow ${r + 1}:`);
  for (let c = 0; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (cell && cell.v != null && cell.v !== "") {
      console.log(`  ${XLSX.utils.encode_col(c)} (${addr}): ${JSON.stringify(cell.v).slice(0, 60)}`);
    }
  }
}

console.log("\n--- merges ---");
console.log(sheet["!merges"]?.slice(0, 10));
