// @vitest-environment node
import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbook } from "@/lib/excel/parse";

function buildWorkbook(rows: any[][], sheetName = "Engine Tracker"): Uint8Array {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

describe("parseWorkbook", () => {
  it("returns empty arrays for an empty workbook", () => {
    const buf = buildWorkbook([["Header1"]], "Sheet1");
    const result = parseWorkbook(buf);
    expect(result.shopVisits).toEqual([]);
    expect(result.forecasts).toEqual([]);
  });

  it("recognises 'Engine Tracker' sheet name", () => {
    const buf = buildWorkbook(
      [
        ["Lessor", "Operator", "ESN", "Engine Type", "On-Wing/Off-Wing"],
        ["AerCap", "Air France", "12345", "Trent 1000", "On-Wing"],
      ],
      "Engine Tracker",
    );
    const result = parseWorkbook(buf);
    expect(result.shopVisits.length).toBe(1);
    expect(result.shopVisits[0].esn).toBe("12345");
    expect(result.shopVisits[0].engineType).toBe("Trent 1000");
  });

  it("falls back to first/second sheet for older format", () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ["Lessor", "ESN", "Engine Type"],
      ["X", "100", "Trent 7000"],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([["Lessor", "ESN"]]);
    XLSX.utils.book_append_sheet(wb, ws1, "Full Forecast");
    XLSX.utils.book_append_sheet(wb, ws2, "2026 Forecast");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const result = parseWorkbook(buf);
    expect(result.shopVisits.length).toBe(1);
    expect(result.shopVisits[0].esn).toBe("100");
  });

  it("preserves _rowIndex on parsed rows", () => {
    const buf = buildWorkbook(
      [
        ["ESN", "Engine Type"],
        ["100", "Trent 1000"],
        ["200", "Trent 1000"],
      ],
      "Engine Tracker",
    );
    const result = parseWorkbook(buf);
    expect(result.shopVisits[0]._rowIndex).toBeDefined();
  });
});
