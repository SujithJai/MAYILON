import { z } from "zod";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email(), source: z.string().optional() });

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "newsletter"), 8, 60_000);
  if (!limited.allowed) return fail("Too many requests", [], 429);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  await db
    .insert(subscribers)
    .values({ email: parsed.data.email.toLowerCase(), source: parsed.data.source ?? "footer" })
    .onConflictDoNothing();

  return ok({ subscribed: true }, "Subscribed successfully");
}
