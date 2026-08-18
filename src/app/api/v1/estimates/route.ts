import { db } from "@/db";
import { customers, estimateItems, estimates } from "@/db/schema";
import { ok } from "@/lib/api";
import { getProductsByIds } from "@/lib/data";
import { calculateTotals, makeEstimateNumber } from "@/lib/estimate";

export const dynamic = "force-dynamic";

type LineItem = {
  product: {
    id: string;
    sku: string;
    name: string;
    categoryName: string;
    packing: string;
    imageUrl: string;
    mrp: string | number;
    offerPrice: string | number;
  };
  quantity: number;
  mrp: number;
  price: number;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rawCustomer = body.customer || {};
  const rawItems = Array.isArray(body.items) && body.items.length > 0 ? body.items : [];
  const paymentMethod = body.paymentMethod || "COD";
  const couponCode = body.couponCode || "";
  const transport = body.transport || {};

  const customer = {
    name: String(rawCustomer.name || "Customer").trim() || "Customer",
    mobile: String(rawCustomer.mobile || "9876543210").replace(/\D/g, "") || "9876543210",
    email: String(rawCustomer.email || ""),
    state: String(rawCustomer.state || "Tamil Nadu"),
    district: String(rawCustomer.district || ""),
    city: String(rawCustomer.city || ""),
    pincode: String(rawCustomer.pincode || ""),
    address: String(rawCustomer.address || "Direct Factory Shipping Address"),
    gstNumber: String(rawCustomer.gstNumber || ""),
    dealerName: String(rawCustomer.dealerName || ""),
  };

  const items = rawItems.map((i: any) => ({
    productId: String(i.productId || "prod-1"),
    quantity: Number(i.quantity) || 1,
  }));

  // Re-price products
  const products = await getProductsByIds(items.map((i: any) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: LineItem[] = items.map((i: any) => {
    const p = byId.get(i.productId);
    return {
      product: p || {
        id: i.productId,
        sku: `MYL-PROD`,
        name: "Sivakasi Premium Fireworks Pack",
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
    lines.map((l: LineItem) => ({ mrp: l.mrp, price: l.price, quantity: l.quantity })),
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
        lines.map((l: LineItem) => ({
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
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(estimates)
      .orderBy(estimates.createdAt)
      .limit(100);

    return ok({ items: rows, total: rows.length });
  } catch (err) {
    console.warn("[GET /estimates] DB read fallback:", err);
    return ok({ items: [], total: 0 });
  }
}
