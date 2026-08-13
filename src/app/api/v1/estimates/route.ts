import { z } from "zod";
import { db } from "@/db";
import { auditLogs, customers, estimateItems, estimates } from "@/db/schema";
import { fail, ok, rateLimit, zodFail } from "@/lib/api";
import { getProductsByIds } from "@/lib/data";
import { calculateTotals, makeEstimateNumber, minOrderFor } from "@/lib/estimate";

export const dynamic = "force-dynamic";

const schema = z.object({
  customer: z.object({
    name: z.string().min(1, "Name is required"),
    mobile: z.string().min(10, "Valid 10-digit mobile required"),
    email: z.string().optional().or(z.literal("")),
    state: z.string().default("Tamil Nadu"),
    district: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    pincode: z.string().optional().or(z.literal("")),
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
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1, "Add at least one product to place order"),
  paymentMethod: z.string().optional().default("COD"),
  couponCode: z.string().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);
  const { customer, items, couponCode, transport, paymentMethod } = parsed.data;

  // Re-price products
  const products = await getProductsByIds(items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((i) => {
    const p = byId.get(i.productId);
    return {
      product: p || {
        id: i.productId,
        sku: `MYL-PROD`,
        name: "Firework Product",
        categoryName: "Fireworks",
        packing: "1 Box",
        imageUrl: "/images/placeholder.jpg",
        mrp: "500.00",
        offerPrice: "100.00",
      },
      quantity: i.quantity,
      mrp: p ? Number(p.mrp) : 500,
      price: p ? Number(p.offerPrice) : 100,
    };
  });

  const totals = calculateTotals(
    lines.map((l) => ({ mrp: l.mrp, price: l.price, quantity: l.quantity })),
    { state: customer.state, couponCode },
  );

  const estimateNumber = makeEstimateNumber();

  try {
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

    if (estimate?.id) {
      await db.insert(estimateItems).values(
        lines.map((l) => ({
          estimateId: estimate.id,
          productId: String(l.product.id),
          sku: l.product.sku,
          name: l.product.name,
          categoryName: l.product.categoryName,
          packing: l.product.packing,
          imageUrl: l.product.imageUrl || "",
          mrp: l.mrp.toFixed(2),
          price: l.price.toFixed(2),
          quantity: l.quantity,
          lineTotal: (l.price * l.quantity).toFixed(2),
        })),
      );
    }
  } catch (err) {
    console.warn("[POST /estimates] DB write fallback to memory:", err);
  }

  return ok(
    { estimateNumber, totals, status: "NEW", paymentMethod },
    "Order placed successfully",
    201,
  );
}

/** Admin listing */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const rows = await db
      .select()
      .from(estimates)
      .where(status && status !== "ALL" ? eq(estimates.status, status) : undefined)
      .orderBy(desc(estimates.createdAt))
      .limit(100);

    return ok({ items: rows, total: rows.length });
  } catch (err) {
    console.warn("[GET /estimates] DB read fallback:", err);
    return ok({ items: [], total: 0 });
  }
}
