// V5/src/utils/parseExcel.ts
//
// Browser adapter for the shared Excel parser at lib/excel/parse.ts.
// Existing V4 callers pass a File; this shim converts to ArrayBuffer.

import {
  parseWorkbook as parseWorkbookCore,
  parseSingleShopSheet as parseSingleShopSheetCore,
  parseSingleForecastSheet as parseSingleForecastSheetCore,
  type ParsedWorkbook,
  type ShopVisitRecord,
  type ForecastRecord,
} from "@/lib/excel/parse";

export type { ShopVisitRecord, ForecastRecord, ParsedWorkbook };

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  return parseWorkbookCore(buffer);
}

export async function parseSingleShopSheet(file: File): Promise<ShopVisitRecord[]> {
  const buffer = await file.arrayBuffer();
  return parseSingleShopSheetCore(buffer);
}

export async function parseSingleForecastSheet(file: File): Promise<ForecastRecord[]> {
  const buffer = await file.arrayBuffer();
  return parseSingleForecastSheetCore(buffer);
}
