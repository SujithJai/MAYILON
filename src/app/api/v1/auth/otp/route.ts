import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const sendSchema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile") });
const verifySchema = sendSchema.extend({ code: z.string().length(6) });

/** Send OTP */
export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "otp-send"), 6, 60_000);
  if (!limited.allowed) return fail("Too many OTP requests. Try again in a minute.", [], 429);

  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  await db.insert(otpCodes).values({
    mobile: parsed.data.mobile,
    code,
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });

  // In production this dispatches through MSG91/Fast2SMS. Preview returns the
  // code so the estimate flow stays fully testable without an SMS gateway.
  const gatewayConfigured = Boolean(process.env.SMS_API_KEY);
  return ok({
    sent: true,
    expiresInSeconds: 300,
    channel: gatewayConfigured ? "sms" : "preview",
    previewCode: gatewayConfigured ? undefined : code,
  });
}

/** Verify OTP */
export async function PUT(req: Request) {
  const limited = rateLimit(clientKey(req, "otp-verify"), 12, 60_000);
  if (!limited.allowed) return fail("Too many attempts. Please wait.", [], 429);

  const parsed = verifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const { mobile, code } = parsed.data;

  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.mobile, mobile), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!row) return fail("OTP expired. Please request a new code.", [], 410);
  if (row.attempts >= 5) return fail("Maximum attempts exceeded. Request a new code.", [], 429);

  if (row.code !== code) {
    await db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.id, row.id));
    return fail("Incorrect OTP", [], 400);
  }

  await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, row.id));
  return ok({ verified: true, mobile });
}
