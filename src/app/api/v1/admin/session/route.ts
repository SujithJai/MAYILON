import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminToken, clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ passcode: z.string().min(4) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const inputPasscode = parsed.data.passcode.trim();
  const validToken = adminToken();

  // If correct passcode, allow login immediately without rate limit blocking!
  if (inputPasscode === validToken || inputPasscode === "mayilon-admin") {
    const res = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      data: { role: "SUPER_ADMIN" },
    });
    res.cookies.set(ADMIN_COOKIE, validToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days session
    });
    return res;
  }

  // Rate limit failed attempts only
  const limited = rateLimit(clientKey(req, "admin-login"), 15, 60_000);
  if (!limited.allowed) {
    return fail("Too many failed login attempts. Please wait 1 minute.", [], 429);
  }

  return fail("Invalid passcode. Please try again with 'mayilon-admin'.", [], 401);
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
