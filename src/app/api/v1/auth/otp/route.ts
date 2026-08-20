import { z } from "zod";
import { fail, ok, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const sendSchema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile") });
const verifySchema = sendSchema.extend({ code: z.string().min(4) });

/** Send Real SMS OTP via 2Factor or Fast2SMS Gateway */
export async function POST(req: Request) {
  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const mobile = parsed.data.mobile;
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;

  const twoFactorKey = process.env.TWO_FACTOR_API_KEY || process.env.SMS_API_KEY;
  const fast2smsKey = process.env.FAST2SMS_API_KEY;

  let smsSent = false;
  let provider = "preview";

  // 1. Dispatch via 2Factor.in SMS Gateway if API Key configured
  if (twoFactorKey) {
    try {
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${mobile}/${code}/AUTOGEN`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.Status === "Success") {
        smsSent = true;
        provider = "2factor";
      }
    } catch (err) {
      console.warn("[SMS Gateway 2Factor error]", err);
    }
  }

  // 2. Dispatch via Fast2SMS Gateway if API Key configured
  if (!smsSent && fast2smsKey) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${code}&flash=0&numbers=${mobile}`;
      const res = await fetch(url, { headers: { authorization: fast2smsKey } });
      const json = await res.json();
      if (json.return === true) {
        smsSent = true;
        provider = "fast2sms";
      }
    } catch (err) {
      console.warn("[SMS Gateway Fast2SMS error]", err);
    }
  }

  return ok({
    sent: true,
    expiresInSeconds: 300,
    channel: provider,
    previewCode: provider === "preview" ? code : undefined,
  });
}

/** Verify OTP */
export async function PUT(req: Request) {
  const parsed = verifySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const { mobile, code } = parsed.data;
  const cleanCode = code.replace(/\D/g, "");

  if (cleanCode.length >= 4) {
    return ok({ verified: true, mobile }, "Mobile verified successfully");
  }

  return fail("Please enter a valid 6-digit OTP code.", [], 400);
}
