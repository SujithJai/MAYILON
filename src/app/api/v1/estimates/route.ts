import { and, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, customers, estimateItems, estimates, otpCodes } from "@/db/schema";
import { clientKey, fail, ok, rateLimit, requireAdmin, zodFail } from "@/lib/api";
import { getProductsByIds } from "@/lib/data";
import { calculateTotals, makeEstimateNumber, minOrderFor } from "@/lib/estimate";

export const dynamic = "force-dynamic";

const schema = z.object({
  customer: z.object({
    name: z.string().min(2, "Name is required"),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
    email: z.string().email().optional().or(z.literal("")),
    state: z.string().min(2, "State is required"),
    district: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    pincode: z.string().regex(/^\d{6}$/, "6-digit pincode required").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    gstNumber: z.string().optional().or(z.literal("")),
    dealerName: z.string().optional().or(z.literal("")),
  }),
  transport: z
    .object({
      transportName: z.string().optional().or(z.literal("")),
      deliveryLocation: z.string().optional().or(z.literal("")),
      instructions: z.string().optional().or(z.literal("")),
    })
    .optional(),
  items: z
    .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(9999) }))
    .min(1, "Add at least one product to the estimate"),
  couponCode: z.string().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const limited = rateLimit(clientKey(req, "estimate-create"), 10, 60_000);
  if (!limited.allowed) return fail("Too many submissions. Please slow down.", [], 429);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const { customer, items, couponCode, transport } = parsed.data;

  // OTP gate: a verified code within the last 30 minutes is required
  const [verified] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.mobile, customer.mobile),
        eq(otpCodes.consumed, true),
        gt(otpCodes.createdAt, new Date(Date.now() - 30 * 60_000)),
      ),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!verified) return fail("Mobile number not verified. Please verify the OTP first.", [], 403);

  // Re-price on the server — client totals are never trusted
  const products = await getProductsByIds(items.map((i) => i.productId));
  if (!products.length) return fail("None of the selected products are available", [], 404);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items
    .filter((i) => byId.has(i.productId))
    .map((i) => {
      const p = byId.get(i.productId)!;
      return {
        product: p,
        quantity: i.quantity,
        mrp: Number(p.mrp),
        price: Number(p.offerPrice),
      };
    });

  const totals = calculateTotals(
    lines.map((l) => ({ mrp: l.mrp, price: l.price, quantity: l.quantity })),
    { state: customer.state, couponCode },
  );

  const minimum = minOrderFor(customer.state);
  if (totals.subtotal < minimum) {
    return fail(
      `Minimum order value for ${customer.state} is ₹${minimum.toLocaleString("en-IN")}. Add ₹${(
        minimum - totals.subtotal
      ).toLocaleString("en-IN")} more to submit.`,
      [{ path: "items", message: "minimum-order" }],
      422,
    );
  }

  const [customerRow] = await db
    .insert(customers)
    .values({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || null,
      state: customer.state,
      district: customer.district || null,
      city: customer.city || null,
      pincode: customer.pincode || null,
      address: customer.address || null,
      gstNumber: customer.gstNumber || null,
      dealerName: customer.dealerName || null,
      isVerified: true,
    })
    .onConflictDoUpdate({
      target: customers.mobile,
      set: {
        name: customer.name,
        email: customer.email || null,
        state: customer.state,
        city: customer.city || null,
        pincode: customer.pincode || null,
        address: customer.address || null,
        isVerified: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  const estimateNumber = makeEstimateNumber();
  const [estimate] = await db
    .insert(estimates)
    .values({
      estimateNumber,
      customerId: customerRow?.id,
      customerName: customer.name,
      mobile: customer.mobile,
      email: customer.email || null,
      state: customer.state,
      district: customer.district || null,
      city: customer.city || null,
      pincode: customer.pincode || null,
      address: customer.address || null,
      gstNumber: customer.gstNumber || null,
      dealerName: customer.dealerName || null,
      transportName: transport?.transportName || null,
      deliveryLocation: transport?.deliveryLocation || null,
      instructions: transport?.instructions || null,
      couponCode: couponCode || null,
      itemCount: totals.itemCount,
      mrpTotal: totals.mrpTotal.toFixed(2),
      subtotal: totals.subtotal.toFixed(2),
      savings: totals.savings.toFixed(2),
      discount: totals.discount.toFixed(2),
      transportCharge: totals.transportCharge.toFixed(2),
      gstAmount: totals.gstAmount.toFixed(2),
      grandTotal: totals.grandTotal.toFixed(2),
      status: "NEW",
    })
    .returning();

  await db.insert(estimateItems).values(
    lines.map((l) => ({
      estimateId: estimate.id,
      productId: l.product.id,
      sku: l.product.sku,
      name: l.product.name,
      categoryName: l.product.categoryName,
      packing: l.product.packing,
      imageUrl: l.product.imageUrl,
      mrp: l.mrp.toFixed(2),
      price: l.price.toFixed(2),
      quantity: l.quantity,
      lineTotal: (l.price * l.quantity).toFixed(2),
    })),
  );

  await db.insert(auditLogs).values({
    actor: customer.mobile,
    action: "ESTIMATE_SUBMITTED",
    entity: "estimate",
    entityId: estimate.id,
    meta: { estimateNumber, grandTotal: totals.grandTotal, items: lines.length },
  });

  return ok(
    { estimateNumber, id: estimate.id, totals, status: "NEW" },
    "Estimate submitted successfully",
    201,
  );
}

/** Admin listing */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const rows = await db
    .select()
    .from(estimates)
    .where(status && status !== "ALL" ? eq(estimates.status, status) : undefined)
    .orderBy(desc(estimates.createdAt))
    .limit(100);

  return ok({ items: rows, total: rows.length });
}
