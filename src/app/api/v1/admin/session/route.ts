import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminToken, clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({ passcode: z.string().min(4) });

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "admin-login"), 5, 5 * 60_000);
  if (!limited.allowed) return fail("Account locked for 5 minutes after repeated failures.", [], 429);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  if (parsed.data.passcode !== adminToken()) {
    await db.insert(auditLogs).values({
      actor: "unknown",
      action: "ADMIN_LOGIN_FAILED",
      entity: "session",
      meta: { at: new Date().toISOString() },
    });
    return fail("Invalid passcode", [], 401);
  }

  await db.insert(auditLogs).values({
    actor: "admin",
    action: "ADMIN_LOGIN",
    entity: "session",
    meta: { at: new Date().toISOString() },
  });

  const res = NextResponse.json({ success: true, message: "Signed in", data: { role: "SUPER_ADMIN" } });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: "Signed out", data: {} });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const authed = cookie.includes(`${ADMIN_COOKIE}=${adminToken()}`);
  return ok({ authenticated: authed });
}
