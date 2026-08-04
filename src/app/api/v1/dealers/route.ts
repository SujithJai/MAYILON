import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dealerApplications } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, requireAdmin, zodFail } from "@/lib/api";

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

  const [row] = await db
    .insert(dealerApplications)
    .values({
      ...parsed.data,
      email: parsed.data.email || null,
      gstNumber: parsed.data.gstNumber || null,
      licenseNumber: parsed.data.licenseNumber || null,
      city: parsed.data.city || null,
      expectedVolume: parsed.data.expectedVolume || null,
    })
    .returning();

  return ok({ id: row.id, status: row.status }, "Dealer application received — our team will verify within 24 hours", 201);
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  const rows = await db
    .select()
    .from(dealerApplications)
    .orderBy(desc(dealerApplications.createdAt))
    .limit(100);
  return ok({ items: rows, total: rows.length });
}
