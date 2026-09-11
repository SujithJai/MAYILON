import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, estimateItems, estimates } from "@/db/schema";
import { fail, ok, zodFail } from "@/lib/api";
import {
  getOrderFromStore,
  persistOrdersToDb,
  saveOrderToStore,
  syncOrdersWithDb,
  updateOrderStatusInStore,
} from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ number: string }> }) {
  await syncOrdersWithDb().catch(() => null);
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

  // Universal Store check and merge
  const cached = getOrderFromStore(number);
  if (cached) {
    if (!estimate) {
      estimate = cached;
      items = cached.items;
    } else {
      // If store has updated status from admin, merge it!
      if (cached.status) estimate.status = cached.status;
      if (cached.paymentStatus) estimate.paymentStatus = cached.paymentStatus;
      if (cached.paymentMethod) estimate.paymentMethod = cached.paymentMethod;
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
  let storeUpdated = updateOrderStatusInStore(number, patchData);
  if (!storeUpdated && body.order) {
    const restored = { ...body.order, ...patchData };
    saveOrderToStore(restored);
    storeUpdated = restored;
  }
  await persistOrdersToDb().catch(() => null);

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

  try {
    revalidatePath("/admin");
    revalidatePath(`/estimate/${number}`);
    revalidatePath("/track");
  } catch (err) {}

  return ok({ estimate: storeUpdated || dbUpdated || patchData }, "Order updated successfully");
}
