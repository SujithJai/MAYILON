import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, requireAdmin, zodFail } from "@/lib/api";

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

  const [row] = await db
    .insert(enquiries)
    .values({
      ...parsed.data,
      email: parsed.data.email || null,
      subject: parsed.data.subject || "General enquiry",
    })
    .returning();

  return ok({ id: row.id }, "Enquiry received — our sales desk will call you shortly", 201);
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(100);
  return ok({ items: rows, total: rows.length });
}
