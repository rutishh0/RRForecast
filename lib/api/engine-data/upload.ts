// V5/lib/api/engine-data/upload.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";
import { parseWorkbook, type ShopVisitRecord, type ForecastRecord } from "@/lib/excel/parse";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { rawXlsxBase64, parsedRows } = (req.body ?? {}) as {
    rawXlsxBase64?: string;
    parsedRows?: { shopVisits: ShopVisitRecord[]; forecasts: ForecastRecord[] };
  };

  if (!rawXlsxBase64 || typeof rawXlsxBase64 !== "string") {
    return res.status(400).json({ error: "rawXlsxBase64 missing or not a string" });
  }

  // Decode + re-parse server-side (authoritative)
  let buf: Buffer;
  try {
    buf = Buffer.from(rawXlsxBase64, "base64");
  } catch (e: any) {
    return res.status(400).json({ error: `Failed to decode base64: ${e.message}` });
  }

  let serverParsed: ReturnType<typeof parseWorkbook>;
  try {
    serverParsed = parseWorkbook(buf);
  } catch (e: any) {
    return res.status(422).json({ error: "Could not parse workbook", detail: e.message });
  }

  // Sanity-check vs client preview (informational, never blocks)
  const warnings: string[] = [];
  if (parsedRows && Array.isArray(parsedRows.shopVisits)) {
    const clientCount = parsedRows.shopVisits.length;
    const serverCount = serverParsed.shopVisits.length;
    if (serverCount !== clientCount && Math.abs(serverCount - clientCount) / Math.max(1, serverCount) > 0.05) {
      warnings.push(
        `Server parsed ${serverCount} shop visits; client preview showed ${clientCount}. Using server count.`,
      );
    }
  }

  // Drop _rowIndex (frontend-only field) and remap to Prisma create input shape
  const stripFrontendOnly = <T extends Record<string, any>>(r: T) => {
    const { _rowIndex, ...rest } = r;
    return { ...rest, rowIndex: typeof _rowIndex === "number" ? _rowIndex : null };
  };

  const shopVisitsToInsert = serverParsed.shopVisits.map(stripFrontendOnly);
  const forecastsToInsert = serverParsed.forecasts.map(stripFrontendOnly);

  // Transactional replace-all
  await prisma.$transaction(async (tx) => {
    await tx.forecast.deleteMany({});
    await tx.shopVisit.deleteMany({});
    if (shopVisitsToInsert.length > 0) {
      await tx.shopVisit.createMany({ data: shopVisitsToInsert as any });
    }
    if (forecastsToInsert.length > 0) {
      await tx.forecast.createMany({ data: forecastsToInsert as any });
    }
  });

  // Return server's authoritative rows (after the transaction)
  const [shopVisits, forecasts] = await Promise.all([
    prisma.shopVisit.findMany(),
    prisma.forecast.findMany(),
  ]);

  return res.status(200).json({
    shopVisits,
    forecasts,
    uploadedAt: new Date().toISOString(),
    ...(warnings.length > 0 ? { warnings } : {}),
  });
});
