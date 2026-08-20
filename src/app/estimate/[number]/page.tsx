import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { estimateItems, estimates } from "@/db/schema";
import { OrderInvoiceView } from "@/components/estimate/OrderInvoiceView";

export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order ${number}`, robots: { index: false, follow: false } };
}

export default async function EstimateConfirmationPage({ params }: { params: Params }) {
  const { number } = await params;
  let estimate: Record<string, any> | undefined;
  let items: any[] = [];

  try {
    const [row] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.estimateNumber, number))
      .limit(1);
    estimate = row;

    if (estimate?.id) {
      items = await db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, estimate.id));
    }
  } catch (err) {
    console.warn("[EstimateConfirmationPage] DB read note:", err);
  }

  if (!estimate || !items.length) {
    try {
      const { getOrderFromStore } = await import("@/lib/orders-store");
      const stored = getOrderFromStore(number);
      if (stored) {
        estimate = stored;
        items = stored.items;
      }
    } catch (storeErr) {
      console.warn("[getOrderFromStore read error]", storeErr);
    }
  }

  return (
    <OrderInvoiceView
      number={number}
      initialEstimate={estimate}
      initialItems={items}
    />
  );
}
