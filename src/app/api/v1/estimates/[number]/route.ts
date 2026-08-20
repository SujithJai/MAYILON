import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, estimateItems, estimates } from "@/db/schema";
import { fail, ok, zodFail } from "@/lib/api";
import { getOrderFromStore, updateOrderStatusInStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ number: string }> }) {
  const { number } = await ctx.params;

  let estimate: any = undefined;
  let items: any[] = [];

  try {
    const [row] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.estimateNumber, number))
      .limit(1);
    estimate = row;

    if (estimate?.id) {
      items = await db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimate.id));
    }
  } catch (err) {
    console.warn("[GET /estimates/[number]] DB read fallback:", err);
  }

  if (!estimate) {
    const cached = getOrderFromStore(number);
    if (cached) {
      estimate = cached;
      items = cached.items;
    }
  }

  if (!estimate) return fail("Order estimate not found", [], 404);

  return ok({ estimate, items });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ number: string }> }) {
  const { number } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const patchData: Record<string, any> = {};
  if (body.status) patchData.status = body.status;
  if (body.paymentStatus) patchData.paymentStatus = body.paymentStatus;
  if (body.paymentMethod) patchData.paymentMethod = body.paymentMethod;

  // 1. Update in Universal Store
  const storeUpdated = updateOrderStatusInStore(number, patchData);

  // 2. Best-effort DB update
  let dbUpdated: any = null;
  try {
    const [row] = await db
      .update(estimates)
      .set({ ...patchData, updatedAt: new Date() })
      .where(eq(estimates.estimateNumber, number))
      .returning();
    dbUpdated = row;
  } catch (err) {
    console.warn("[PATCH /estimates/[number]] DB update note:", err);
  }

  return ok({ estimate: storeUpdated || dbUpdated }, "Order updated successfully");
}
