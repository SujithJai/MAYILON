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

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source ?? "footer";

  // 1. Guaranteed storage to subscribers store
  const { saveSubscriberToStore } = await import("@/lib/subscribers-store");
  saveSubscriberToStore({
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    source,
    createdAt: new Date().toISOString(),
  });

  // 2. Best-effort DB insert
  try {
    await db
      .insert(subscribers)
      .values({ email, source })
      .onConflictDoNothing();
  } catch (err) {
    console.warn("[newsletter] DB sync note (safe fallback to store):", err);
  }

  return ok({ subscribed: true }, "Subscribed successfully", 201);
}
