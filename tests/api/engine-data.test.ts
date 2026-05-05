// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import getSnapshot from "@/lib/api/engine-data/get";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

describe("GET /api/engine-data", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-engine-data-secret";
    await prisma.shopVisit.deleteMany({});
    await prisma.forecast.deleteMany({});
  });

  it("returns 401 without auth", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await getSnapshot(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("returns empty arrays when DB is empty", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await getSnapshot(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.shopVisits).toEqual([]);
    expect(data.forecasts).toEqual([]);
    expect(data.uploadedAt).toBeNull();
  });

  it("returns rows + most recent uploadedAt", async () => {
    const t1 = new Date("2026-01-01T00:00:00Z");
    const t2 = new Date("2026-02-01T00:00:00Z");
    await prisma.shopVisit.create({ data: { esn: "111", engineType: "Trent 1000", uploadedAt: t1 } });
    await prisma.forecast.create({ data: { esn: "222", engineType: "Trent 7000", uploadedAt: t2 } });

    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await getSnapshot(req as any, res as any);

    const data = JSON.parse(res._getData());
    expect(data.shopVisits.length).toBe(1);
    expect(data.forecasts.length).toBe(1);
    expect(new Date(data.uploadedAt).getTime()).toBe(t2.getTime());
  });
});

import upload from "@/lib/api/engine-data/upload";
import * as XLSX from "xlsx";

function buildXlsxBase64(rows: any[][], sheetName = "Engine Tracker"): string {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  return Buffer.from(arr).toString("base64");
}

describe("POST /api/engine-data/upload", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-upload-secret";
    await prisma.shopVisit.deleteMany({});
    await prisma.forecast.deleteMany({});
  });

  it("returns 401 without auth", async () => {
    const { req, res } = createMocks({ method: "POST", body: { rawXlsxBase64: "" } });
    await upload(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });

  it("returns 400 if rawXlsxBase64 missing", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { parsedRows: { shopVisits: [], forecasts: [] } },
    });
    await upload(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
  });

  it("inserts new rows on first upload", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });
    const rawXlsxBase64 = buildXlsxBase64([
      ["Lessor", "Operator", "ESN", "Engine Type", "On-Wing/Off-Wing"],
      ["AerCap", "Air France", "12345", "Trent 1000", "On-Wing"],
    ]);
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { rawXlsxBase64, parsedRows: { shopVisits: [], forecasts: [] } },
    });
    await upload(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.shopVisits.length).toBe(1);
    expect(data.shopVisits[0].esn).toBe("12345");
    const dbCount = await prisma.shopVisit.count();
    expect(dbCount).toBe(1);
  });

  it("replaces all on second upload (replace-all semantics)", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });

    // First upload
    let { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: {
        rawXlsxBase64: buildXlsxBase64([["ESN"], ["A"], ["B"], ["C"]]),
        parsedRows: { shopVisits: [], forecasts: [] },
      },
    });
    await upload(req as any, res as any);
    expect(await prisma.shopVisit.count()).toBe(3);

    // Second upload with different rows
    ({ req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: {
        rawXlsxBase64: buildXlsxBase64([["ESN"], ["X"], ["Y"]]),
        parsedRows: { shopVisits: [], forecasts: [] },
      },
    }));
    await upload(req as any, res as any);
    expect(await prisma.shopVisit.count()).toBe(2);
    const all = await prisma.shopVisit.findMany();
    expect(all.map((r) => r.esn).sort()).toEqual(["X", "Y"]);
  });
});
