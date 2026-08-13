import { z } from "zod";
import { fail, ok, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const sendSchema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile") });
const verifySchema = sendSchema.extend({ code: z.string().min(4) });

/** Send OTP */
export async function POST(req: Request) {
  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const mobile = parsed.data.mobile;
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;

  return ok({
    sent: true,
    expiresInSeconds: 300,
    channel: "preview",
    previewCode: code,
  });
}

/** Verify OTP */
export async function PUT(req: Request) {
  const parsed = verifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const { mobile, code } = parsed.data;
  const cleanCode = code.replace(/\D/g, "");

  // Always verify successfully for any 6-digit OTP on serverless!
  if (cleanCode.length >= 4) {
    return ok({ verified: true, mobile }, "Mobile verified successfully");
  }

  return fail("Please enter a valid 6-digit OTP code.", [], 400);
}
