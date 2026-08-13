import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function ok<T>(data: T, message = "Operation Successful", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

export function zodFail(err: ZodError) {
  const firstIssueMessage = err.issues[0]?.message || "Invalid input details";
  return fail(
    firstIssueMessage,
    err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    422,
  );
}

/* --------------------------- rate limiting --------------------------- */

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  b.count += 1;
  if (b.count > limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - b.count };
}

export function clientKey(req: Request, scope: string) {
  const fwd = req.headers.get("x-forwarded-for") ?? "local";
  return `${scope}:${fwd.split(",")[0].trim()}`;
}

/* ------------------------- admin authorization ----------------------- */

export const ADMIN_COOKIE = "mayilon_admin";

export function adminToken() {
  return process.env.ADMIN_PASSCODE ?? "mayilon-admin";
}

export function isAdminRequest(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  const header = req.headers.get("x-admin-key");
  return match?.[1] === adminToken() || header === adminToken();
}

export function requireAdmin(req: Request) {
  if (!isAdminRequest(req)) return fail("Unauthorized — admin session required", [], 401);
  return null;
}
