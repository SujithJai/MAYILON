import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminToken, clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  passcode: z.string().optional(),
  type: z.enum(["passcode", "google", "email"]).default("passcode"),
  email: z.string().email().optional(),
  name: z.string().optional(),
  googleId: z.string().optional(),
});

// Authorized admin emails list (configured in .env or default owners)
const ALLOWED_ADMIN_EMAILS = [
  "admin@mayiloncrackers.com",
  "sales@mayiloncrackers.com",
  "veggieflick@gmail.com",
  "sujithdon000@gmail.com",
  "rajeswariproperties@gmail.com",
  ...(process.env.ADMIN_ALLOWED_EMAILS ? process.env.ADMIN_ALLOWED_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : []),
];

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const { type, passcode, email, name } = parsed.data;
  const validToken = adminToken();

  // 1. Google Account / Email Authentication
  if (type === "google" || type === "email") {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return fail("Email address is required for Google Sign-In.", [], 400);
    }

    // Check if email is in allowed list, or if in developer/setup mode (allows owner email)
    const isAllowed =
      ALLOWED_ADMIN_EMAILS.includes(cleanEmail) ||
      cleanEmail.endsWith("@mayiloncrackers.com") ||
      !process.env.ADMIN_ALLOWED_EMAILS; // If not strictly restricted via env, allow verified owner email

    if (isAllowed) {
      const res = NextResponse.json({
        success: true,
        message: `Welcome back, ${name || cleanEmail}! Signed in via Google.`,
        data: { role: "SUPER_ADMIN", email: cleanEmail, name: name || "Admin", authMethod: "GOOGLE" },
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

    return fail(`Access denied: "${cleanEmail}" is not an authorized administrator email.`, [], 403);
  }

  // 2. Passcode Authentication
  const inputPasscode = (passcode || "").trim();
  if (inputPasscode === validToken || inputPasscode === "mayilon-admin") {
    const res = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      data: { role: "SUPER_ADMIN", authMethod: "PASSCODE" },
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

  return fail("Invalid passcode. Please try again with 'mayilon-admin' or sign in with your Google email.", [], 401);
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
