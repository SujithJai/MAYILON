import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, estimateItems, estimates } from "@/db/schema";
import { fail, ok, requireAdmin, zodFail } from "@/lib/api";

export const dynamic = "force-dynamic";

const STATUS_FLOW = [
  "NEW",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CONVERTED",
  "PACKING",
  "DISPATCHED",
  "DELIVERED",
] as const;

export async function GET(_req: Request, ctx: { params: Promise<{ number: string }> }) {
  const { number } = await ctx.params;
  const [estimate] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.estimateNumber, number))
    .limit(1);
  if (!estimate) return fail("Estimate not found", [], 404);

  const items = await db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimate.id));
  return ok({ estimate, items });
}

const patchSchema = z.object({
  status: z.enum(STATUS_FLOW).optional(),
  adminNote: z.string().max(2000).optional(),
  assignedTo: z.string().max(120).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ number: string }> }) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { number } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const [updated] = await db
    .update(estimates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(estimates.estimateNumber, number))
    .returning();

  if (!updated) return fail("Estimate not found", [], 404);

  await db.insert(auditLogs).values({
    actor: "admin",
    action: "ESTIMATE_UPDATED",
    entity: "estimate",
    entityId: updated.id,
    meta: { ...parsed.data, estimateNumber: number },
  });

  return ok({ estimate: updated }, "Estimate updated");
}
