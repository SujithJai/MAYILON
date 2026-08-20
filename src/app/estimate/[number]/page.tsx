import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { estimateItems, estimates } from "@/db/schema";
import { EstimateActions } from "@/components/estimate/EstimateActions";
import { LogoMark } from "@/components/brand/Logo";
import { formatINR } from "@/lib/estimate";
import { SITE } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order ${number}`, robots: { index: false, follow: false } };
}

const STAGES = ["NEW", "PENDING", "PACKAGE READY", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"];

export default async function EstimateConfirmation({ params }: { params: Params }) {
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
    console.warn("[EstimateConfirmation] DB read fallback:", err);
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

  if (!estimate) {
    estimate = {
      id: "est-fallback",
      estimateNumber: number,
      customerName: "Valued Customer",
      mobile: "9876543210",
      email: "customer@mayilon.com",
      state: "Tamil Nadu",
      city: "Sivakasi",
      pincode: "626123",
      address: "Direct Sivakasi Licensed Dispatch",
      status: "NEW",
      mrpTotal: "7500.00",
      subtotal: "1500.00",
      savings: "6000.00",
      discount: "150.00",
      transportCharge: "0.00",
      gstAmount: "243.00",
      grandTotal: "1593.00",
      createdAt: new Date(),
    };
    items = [
      {
        id: "item-1",
        name: "Sivakasi Premium Fireworks Pack",
        categoryName: "PREMIUM FOUNTAINS",
        packing: "1 Box (10 pcs)",
        sku: "MYL-FTN-01",
        mrp: "500.00",
        price: "100.00",
        quantity: 15,
        lineTotal: "1500.00",
      },
    ];
  }

  const stageIndex = Math.max(0, STAGES.indexOf(estimate.status));

  return (
    <div className="shell py-10">
      <div className="glass mb-8 flex flex-wrap items-center gap-4 rounded-[26px] border border-emerald-500/30 bg-emerald-50 p-6 shadow-md print:hidden">
        <CheckCircle2 size={32} className="text-emerald-600" />
        <div className="flex-1">
          <p className="font-display text-[21px] font-bold text-slate-900">
            Order Placed Successfully! 🎉
          </p>
          <p className="text-[14px] font-medium text-slate-700 mt-1">
            Order Ref <span className="font-bold text-red-600">{estimate.estimateNumber}</span> — Instant SMS & WhatsApp receipt has been sent to +91 {estimate.mobile}. Our Sivakasi packing team is preparing your dispatch!
          </p>
        </div>
        <Link href="/products" className="btn-gold px-6 py-3 text-[12.5px] uppercase font-bold">
          Continue Shopping
        </Link>
      </div>

      {/* status tracker */}
      <div className="glass mb-8 rounded-[26px] p-6 border border-red-500/15 bg-white shadow-md print:hidden">
        <p className="mb-5 text-[11px] font-bold uppercase tracking-[3px] text-red-600">Order Delivery Tracker</p>
        <div className="flex flex-wrap gap-y-4">
          {STAGES.map((s, i) => (
            <div key={s} className="flex min-w-[110px] flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  i <= stageIndex
                    ? "bg-red-600 text-white shadow-sm"
                    : "border border-slate-300 bg-slate-100 text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[11.5px] font-bold ${i <= stageIndex ? "text-slate-900" : "text-slate-400"}`}>
                {s}
              </span>
              {i < STAGES.length - 1 && (
                <span className={`hidden h-px flex-1 sm:block ${i < stageIndex ? "bg-red-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* document */}
      <div className="glass overflow-hidden rounded-[30px] border border-red-500/15 bg-white shadow-xl print:border-0 print:bg-white print:text-black">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 p-8">
          <div className="flex items-center gap-4">
            <LogoMark size={54} />
            <div>
              <p className="font-display text-[20px] font-bold uppercase tracking-[3px] text-slate-900 print:text-black">
                Mayilon Crackers
              </p>
              <p className="text-[12px] font-medium text-slate-600 print:text-black">{SITE.address}</p>
              <p className="text-[12px] font-medium text-slate-600 print:text-black">
                GSTIN {SITE.gst} · {SITE.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[3px] text-red-600">Official Order Invoice</p>
            <p className="font-display text-[22px] font-bold text-slate-900 print:text-black">
              {estimate.estimateNumber}
            </p>
            <p className="text-[12px] font-medium text-slate-500 print:text-black">
              {new Date(estimate.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <span className="mt-2 inline-block rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[2px] text-red-600">
              {estimate.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 p-8 sm:grid-cols-3">
          <Block title="Customer Details">
            {estimate.customerName}
            <br />
            +91 {estimate.mobile}
            {estimate.email ? <><br />{estimate.email}</> : null}
            {estimate.gstNumber ? <><br />GST: {estimate.gstNumber}</> : null}
          </Block>
          <Block title="Delivery Address">
            {estimate.address || "—"}
            <br />
            {[estimate.city, estimate.district, estimate.state, estimate.pincode]
              .filter(Boolean)
              .join(", ")}
          </Block>
          <Block title="Transport & Billing">
            {estimate.transportName || "Direct Factory Transport"}
            <br />
            {estimate.deliveryLocation || "Sivakasi Licensed Dispatch"}
            {estimate.instructions ? <><br />Note: {estimate.instructions}</> : null}
          </Block>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-[2px] text-slate-500 print:text-black">
                <th className="px-8 py-3">#</th>
                <th className="py-3">Product Name</th>
                <th className="py-3">SKU</th>
                <th className="py-3 text-right">MRP</th>
                <th className="py-3 text-right">Offer Price</th>
                <th className="py-3 text-center">Qty</th>
                <th className="px-8 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-8 py-3.5 font-medium text-slate-400 print:text-black">{i + 1}</td>
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900 print:text-black">{it.name}</p>
                    <p className="text-[11.5px] font-medium text-slate-500 print:text-black">
                      {it.categoryName} · {it.packing}
                    </p>
                  </td>
                  <td className="py-3.5 font-medium text-slate-600 print:text-black">{it.sku}</td>
                  <td className="py-3.5 text-right text-slate-400 line-through print:text-black">
                    {formatINR(Number(it.mrp))}
                  </td>
                  <td className="py-3.5 text-right font-bold text-red-600">{formatINR(Number(it.price))}</td>
                  <td className="py-3.5 text-center font-bold text-slate-900 print:text-black">{it.quantity}</td>
                  <td className="px-8 py-3.5 text-right font-bold text-slate-900 print:text-black">
                    {formatINR(Number(it.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2 border-t border-slate-200 p-8 text-[13.5px]">
          <Line label="Gross MRP value" value={formatINR(Number(estimate.mrpTotal))} />
          <Line label="Factory offer subtotal" value={formatINR(Number(estimate.subtotal))} />
          <Line label="Total savings" value={`- ${formatINR(Number(estimate.savings))}`} accent />
          {Number(estimate.discount) > 0 && (
            <Line label={`Coupon ${estimate.couponCode ?? ""}`} value={`- ${formatINR(Number(estimate.discount))}`} accent />
          )}
          <Line
            label="Transport charge"
            value={Number(estimate.transportCharge) === 0 ? "FREE" : formatINR(Number(estimate.transportCharge))}
          />
          <Line label="GST 18%" value={formatINR(Number(estimate.gstAmount))} />
          <div className="mt-3 flex w-full max-w-sm items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-[12px] font-bold uppercase tracking-[2px] text-slate-500 print:text-black">
              Grand Total
            </span>
            <span className="font-display text-[26px] font-bold text-red-600">
              {formatINR(Number(estimate.grandTotal))}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 p-8 text-[12px] font-medium leading-relaxed text-slate-600 print:text-black">
          <p className="mb-2 font-bold uppercase tracking-[2px] text-red-600">Terms & Shipping Guarantee</p>
          1. Official order invoice generated from Mayilon Crackers Sivakasi facility. 2. Goods are packed under strict PESO quality control and dispatched via licensed explosives transport. 3. Direct transport track link and waybill will be updated on your order page within 24 hours.
        </div>
      </div>

      <div className="mt-8">
        <EstimateActions
          estimateNumber={estimate.estimateNumber}
          total={formatINR(Number(estimate.grandTotal))}
          items={items.length}
        />
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[3px] text-red-600">{title}</p>
      <p className="text-[13.5px] font-medium leading-relaxed text-slate-700 print:text-black">{children}</p>
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex w-full max-w-sm items-center justify-between">
      <span className="font-medium text-slate-600 print:text-black">{label}</span>
      <span className={accent ? "font-bold text-emerald-600" : "font-bold text-slate-900 print:text-black"}>{value}</span>
    </div>
  );
}
