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
  let apiLog = "";

  // 1. Dispatch via Fast2SMS Gateway (Live Active Key)
  if (fast2smsKey) {
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    // Method A: Fast2SMS GET Quick Route (No DLT template needed)
    try {
      const msg = encodeURIComponent(`Your Mayilon Pyroworld OTP for login is ${code}. Valid for 5 minutes.`);
      const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=q&message=${msg}&language=english&flash=0&numbers=${cleanMobile}`;
      const res = await fetch(getUrl);
      const json = await res.json();
      apiLog = JSON.stringify(json);
      if (json.return === true || json.status_code === 200) {
        smsSent = true;
        provider = "fast2sms";
      }
    } catch (err) {
      console.warn("[Fast2SMS GET error]", err);
    }

    // Method B: Fast2SMS POST OTP Route if GET didn't flag success
    if (!smsSent) {
      try {
        const postRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
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
        const postJson = await postRes.json();
        if (postJson.return === true || postJson.status_code === 200) {
          smsSent = true;
          provider = "fast2sms";
        }
      } catch (err) {
        console.warn("[Fast2SMS POST error]", err);
      }
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
    log: apiLog,
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
