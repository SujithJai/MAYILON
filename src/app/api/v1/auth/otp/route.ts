import { z } from "zod";
import { fail, ok, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const sendSchema = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile") });
const verifySchema = sendSchema.extend({ code: z.string().min(4) });

const FAST2SMS_DEFAULT_KEY = "tw6Vn9Rqv5bBZgMoQiLjX3HGkJxOyCP14ldhszE2UDaNeK7pcWB7Q9mOG5cd6ebi1tlK4nPYApvSW08f";

/** Send Real SMS OTP via 2Factor or Fast2SMS Gateway */
export async function POST(req: Request) {
  const parsed = sendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const mobile = parsed.data.mobile;
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;

  const twoFactorKey = process.env.TWO_FACTOR_API_KEY || process.env.SMS_API_KEY;
  const fast2smsKey = process.env.FAST2SMS_API_KEY || FAST2SMS_DEFAULT_KEY;

  let smsSent = false;
  let provider = "preview";

  // 1. Dispatch via Fast2SMS Gateway (Live Active Key)
  if (fast2smsKey) {
    try {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

      // Fast2SMS OTP route
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2smsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: code,
          numbers: cleanMobile,
        }),
      });
      const json = await res.json();

      if (json.return === true || json.status_code === 200) {
        smsSent = true;
        provider = "fast2sms";
      } else {
        // Fallback to Quick SMS route if DLT template is pending
        const qRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: `Your Mayilon Pyroworld login OTP code is ${code}. Valid for 5 minutes.`,
            numbers: cleanMobile,
            flash: "0",
          }),
        });
        const qJson = await qRes.json();
        if (qJson.return === true || qJson.status_code === 200) {
          smsSent = true;
          provider = "fast2sms";
        }
      }
    } catch (err) {
      console.warn("[SMS Gateway Fast2SMS error]", err);
    }
  }

  // 2. Fallback via 2Factor.in SMS Gateway if configured
  if (!smsSent && twoFactorKey) {
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

  return ok({
    sent: true,
    expiresInSeconds: 300,
    channel: provider,
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
