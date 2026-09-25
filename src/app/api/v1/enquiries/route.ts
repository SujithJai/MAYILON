import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, requireAdmin, zodFail } from "@/lib/api";
import { getAllEnquiriesFromStore, saveEnquiryToStore, type EnquiryRecord } from "@/lib/enquiries-store";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().optional().or(z.literal("")),
  message: z.string().min(5),
});

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "enquiry"), 6, 60_000);
  if (!limited.allowed) return fail("Too many requests", [], 429);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const newRecord: EnquiryRecord = {
    id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: parsed.data.name,
    mobile: parsed.data.mobile,
    email: parsed.data.email || null,
    subject: parsed.data.subject || "General enquiry",
    message: parsed.data.message,
    createdAt: new Date().toISOString(),
  };

  // 1. Guaranteed storage to universal store first
  saveEnquiryToStore(newRecord);

  // 2. Best-effort DB insert
  try {
    const [row] = await db
      .insert(enquiries)
      .values({
        name: newRecord.name,
        mobile: newRecord.mobile,
        email: newRecord.email,
        subject: newRecord.subject,
        message: newRecord.message,
      })
      .returning();
    if (row?.id) newRecord.id = row.id;
  } catch (err) {
    console.warn("[enquiries] DB sync note (safe fallback to store):", err);
  }

  return ok({ id: newRecord.id }, "Enquiry received — our sales desk will call you shortly", 201);
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const storeItems = getAllEnquiriesFromStore();
  let dbRows: any[] = [];
  try {
    dbRows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(100);
  } catch (err) {
    console.warn("[enquiries] DB read note:", err);
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
