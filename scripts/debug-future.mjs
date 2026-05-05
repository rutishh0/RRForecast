// Debug Future Forecast header detection
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const buf = readFileSync("C:/Users/Rutishkrishna/Desktop/RR/RR Forecasting/V4/ExcelV4/Lessor_SV_Tracker_Filled_V8.5_(1).xlsx");
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
const sheet = wb.Sheets["Future Forecast"];
const range = XLSX.utils.decode_range(sheet["!ref"]);

for (let r = 0; r <= 6; r++) {
  console.log(`\n--- row ${r + 1} (0-idx ${r}) ---`);
  for (let c = 0; c <= Math.min(range.e.c, 15); c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (cell && cell.v != null && cell.v !== "") {
      console.log(`  ${XLSX.utils.encode_col(c)}: ${JSON.stringify(cell.v).slice(0, 60)}`);
    }
  }
}

// Apply the same findHeaderRow logic used by the parser
console.log("\n--- findHeaderRow simulation ---");
for (let r = 0; r <= 8; r++) {
  const vals = [];
  for (let c = 0; c <= Math.min(range.e.c, 50); c++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c })];
    if (cell) vals.push(String(cell.v || "").toLowerCase().trim());
  }
  const joined = vals.join(" ");
  const hasLessorOrCustomer = joined.includes("lessor") || joined.includes("customer");
  const hasIdentifier = joined.includes("operator") || joined.includes("esn");
  console.log(`row ${r+1}: lessor=${hasLessorOrCustomer} ident=${hasIdentifier} match=${hasLessorOrCustomer && hasIdentifier}`);
  if (hasLessorOrCustomer && hasIdentifier) {
    console.log("  → would pick this as header");
    console.log("  joined =", joined.slice(0, 200));
    break;
  }
}
