// V5/lib/auth/site-gate.ts
import crypto from "node:crypto";

export function verifySiteCode(input: string): boolean {
  const expected = process.env.SITE_ACCESS_CODE;
  if (!expected) {
    throw new Error("SITE_ACCESS_CODE env var not set (server misconfigured)");
  }
  if (typeof input !== "string" || input.length === 0) return false;

  // Pad both to equal length for timing-safe comparison
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // crypto.timingSafeEqual requires equal-length buffers; return false but
    // still do a fixed-cost compare against the expected to keep timing flat.
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
