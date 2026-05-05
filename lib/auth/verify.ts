// V5/lib/auth/verify.ts
import { verifyJwt } from "./jwt";
import type { Role } from "./jwt";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface VerifiedAuth {
  userId: number;
  role: Role;
}

interface AnyRequest {
  headers: Record<string, string | string[] | undefined>;
}

function getAuthHeader(req: AnyRequest): string | undefined {
  const h = (req.headers as any).authorization ?? (req.headers as any).Authorization;
  if (Array.isArray(h)) return h[0];
  return h;
}

export async function verifyAuth(req: AnyRequest): Promise<VerifiedAuth> {
  const header = getAuthHeader(req);
  if (!header || !header.startsWith("Bearer ")) {
    throw new AuthError("Missing Authorization Bearer token");
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyJwt(token);
    return { userId: payload.sub, role: payload.role };
  } catch (e: any) {
    throw new AuthError(`Invalid token: ${e?.message ?? "unknown"}`);
  }
}
