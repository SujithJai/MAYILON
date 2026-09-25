import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dealerApplications } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, requireAdmin, zodFail } from "@/lib/api";
import { getAllDealersFromStore, saveDealerToStore, type DealerApplicationRecord } from "@/lib/dealers-store";

export const dynamic = "force-dynamic";

const schema = z.object({
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  email: z.string().email().optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
  licenseNumber: z.string().optional().or(z.literal("")),
  state: z.string().min(2),
  city: z.string().optional().or(z.literal("")),
  expectedVolume: z.string().optional().or(z.literal("")),
  tier: z.enum(["WHOLESALE", "DISTRIBUTOR", "SUPER_DEALER"]).default("WHOLESALE"),
});

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "dealer"), 5, 60_000);
  if (!limited.allowed) return fail("Too many requests", [], 429);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const newRecord: DealerApplicationRecord = {
    id: `dlr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    businessName: parsed.data.businessName,
    contactName: parsed.data.contactName,
    mobile: parsed.data.mobile,
    email: parsed.data.email || null,
    gstNumber: parsed.data.gstNumber || null,
    licenseNumber: parsed.data.licenseNumber || null,
    state: parsed.data.state,
    city: parsed.data.city || null,
    expectedVolume: parsed.data.expectedVolume || null,
    tier: parsed.data.tier,
    status: "PENDING_VERIFICATION",
    createdAt: new Date().toISOString(),
  };

  // 1. Guaranteed storage to universal store first
  saveDealerToStore(newRecord);

  // 2. Best-effort DB insert
  try {
    const [row] = await db
      .insert(dealerApplications)
      .values({
        businessName: newRecord.businessName,
        contactName: newRecord.contactName,
        mobile: newRecord.mobile,
        email: newRecord.email,
        gstNumber: newRecord.gstNumber,
        licenseNumber: newRecord.licenseNumber,
        state: newRecord.state,
        city: newRecord.city,
        expectedVolume: newRecord.expectedVolume,
        tier: newRecord.tier,
      })
      .returning();
    if (row?.id) newRecord.id = row.id;
  } catch (err) {
    console.warn("[dealers] DB sync note (safe fallback to store):", err);
  }

  return ok({ id: newRecord.id, status: newRecord.status }, "Dealer application received — our team will verify within 24 hours", 201);
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const storeItems = getAllDealersFromStore();
  let dbRows: any[] = [];
  try {
    dbRows = await db
      .select()
      .from(dealerApplications)
      .orderBy(desc(dealerApplications.createdAt))
      .limit(100);
  } catch (err) {
    console.warn("[dealers] DB read note:", err);
  }

  const map = new Map<string, any>();
  for (const it of storeItems) map.set(it.id, it);
  for (const r of dbRows) {
    if (!map.has(r.id)) map.set(r.id, r);
  }

  const items = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return ok({ items, total: items.length });
}
