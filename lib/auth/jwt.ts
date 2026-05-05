// V5/lib/auth/jwt.ts
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

export type Role = "admin" | "manager" | "user";

export interface JwtPayload {
  sub: number;
  role: Role;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET env var not set");
  return s;
}

export function signJwt(
  payload: { sub: number; role: Role },
  opts: { expiresIn?: SignOptions["expiresIn"] } = {},
): string {
  return jwt.sign(payload, getSecret(), {
    algorithm: "HS256",
    expiresIn: opts.expiresIn ?? "7d",
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, getSecret(), {
    algorithms: ["HS256"],
  }) as unknown as JwtPayload;
}
