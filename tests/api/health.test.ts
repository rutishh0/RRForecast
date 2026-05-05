// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import health from "@/api/health";

describe("GET /api/health", () => {
  it("returns ok:true and db:connected", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await health(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.ok).toBe(true);
    expect(data.db).toBe("connected");
    expect(data.version).toBeDefined();
  });
});
