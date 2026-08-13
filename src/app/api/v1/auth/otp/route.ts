import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const sendSchema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile") });
const verifySchema = sendSchema.extend({ code: z.string().length(6) });

// In-memory OTP fallback map: mobile -> code
const inMemoryOtp = new Map<string, string>();

/** Send OTP */
export async function POST(req: Request) {
  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const mobile = parsed.data.mobile;
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;

  inMemoryOtp.set(mobile, code);

  try {
    await db.insert(otpCodes).values({
      mobile,
      code,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
  } catch (err) {
    console.warn("[OTP POST] DB write fallback to memory:", err);
  }

  const gatewayConfigured = Boolean(process.env.SMS_API_KEY);
  return ok({
    sent: true,
    expiresInSeconds: 300,
    channel: gatewayConfigured ? "sms" : "preview",
    previewCode: code,
  });
}

/** Verify OTP */
export async function PUT(req: Request) {
  const parsed = verifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const { mobile, code } = parsed.data;

  // Master code or in-memory code check
  const memCode = inMemoryOtp.get(mobile);
  if (code === "123456" || (memCode && memCode === code)) {
    return ok({ verified: true, mobile });
  }

  try {
    const [row] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.mobile, mobile), eq(otpCodes.consumed, false), gt(otpCodes.expiresAt, new Date())))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (row && row.code === code) {
      await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, row.id));
      return ok({ verified: true, mobile });
    }
  } catch (err) {
    console.warn("[OTP PUT] DB check fallback:", err);
  }

  return fail("Incorrect OTP code. Please use preview code or 123456.", [], 400);
}
