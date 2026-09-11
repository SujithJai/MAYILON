"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { EstimateActions } from "@/components/estimate/EstimateActions";
import { formatINR } from "@/lib/estimate";
import { SITE } from "@/lib/slug";

const STAGES = [
  { key: "NEW", label: "Order Placed" },
  { key: "PENDING", label: "Verification" },
  { key: "PACKAGE READY", label: "Package Ready" },
  { key: "SHIPPED", label: "Shipped / Dispatched" },
  { key: "OUT FOR DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

function getStageIndex(status?: string): number {
  if (!status) return 0;
  const s = status.toUpperCase().trim();
  if (s === "DELIVERED") return 5;
  if (s === "OUT FOR DELIVERY") return 4;
  if (s === "SHIPPED") return 3;
  if (s === "PACKAGE READY") return 2;
  if (s === "PENDING" || s === "PAYMENT RECEIVED") return 1;
  return 0; // NEW
}

export function OrderInvoiceView({
  number,
  initialEstimate,
  initialItems,
}: {
  number: string;
  initialEstimate?: any;
  initialItems?: any[];
}) {
  const [estimate, setEstimate] = useState<any>(initialEstimate);
  const [items, setItems] = useState<any[]>(initialItems || []);

  useEffect(() => {
    const syncFromLocalStorage = () => {
      try {
        const recentsRaw = typeof window !== "undefined" ? localStorage.getItem("mayilon_recent_orders") : null;
        if (recentsRaw) {
          const recents = JSON.parse(recentsRaw);
          if (Array.isArray(recents)) {
            const found = recents.find((o: any) => o?.estimateNumber === number);
            if (found) {
              setEstimate((prev: any) => ({ ...prev, ...found }));
              if (Array.isArray(found.items) && found.items.length > 0) {
                setItems(found.items);
              }
            }
          }
        }

        const singleRaw = typeof window !== "undefined" ? localStorage.getItem(`mayilon_order_${number}`) : null;
        if (singleRaw) {
          const parsed = JSON.parse(singleRaw);
          if (parsed) {
            setEstimate((prev: any) => ({ ...prev, ...parsed }));
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              setItems(parsed.items);
            }
          }
        }
      } catch (err) {}
    };

    syncFromLocalStorage();

    // Live polling: Check for Admin status updates every 3 seconds
    const pollLatest = async () => {
      try {
        const res = await fetch(`/api/v1/estimates/${encodeURIComponent(number)}`, { cache: "no-store" });
        const json = await res.json();
        if (json?.success && json?.data?.estimate) {
          setEstimate(json.data.estimate);
          if (Array.isArray(json.data.items) && json.data.items.length > 0) {
            setItems(json.data.items);
          }
        } else {
          // If individual route returned 404, check full list
          const listRes = await fetch(`/api/v1/estimates`, { cache: "no-store" });
          const listJson = await listRes.json();
          if (listJson?.success && Array.isArray(listJson?.data?.items)) {
            const match = listJson.data.items.find((o: any) => o.estimateNumber === number);
            if (match) {
              setEstimate(match);
              if (Array.isArray(match.items) && match.items.length > 0) {
                setItems(match.items);
              }
            }
          }
        }
      } catch (err) {}
      syncFromLocalStorage();
    };

    const pollInterval = setInterval(pollLatest, 3000);
    return () => clearInterval(pollInterval);
  }, [number, initialEstimate]);

  const activeEst = estimate || {
    id: "est-fallback",
    estimateNumber: number,
    customerName: "Valued Customer",
    mobile: "9876543210",
    email: "customer@mayilon.com",
    state: "Tamil Nadu",
    city: "Sivakasi",
    pincode: "626189",
    address: "4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi - 626189",
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

  const activeItems = items.length
    ? items
    : [
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

  const stageIndex = getStageIndex(activeEst.status);

  return (
    <div className="shell py-10">
      <div className="glass mb-8 flex flex-wrap items-center gap-4 rounded-[26px] border border-emerald-500/30 bg-emerald-50 p-6 shadow-md print:hidden">
        <CheckCircle2 size={32} className="text-emerald-600" />
        <div className="flex-1">
          <p className="font-display text-[21px] font-bold text-slate-900">
            Order Placed Successfully! 🎉
          </p>
          <p className="text-[14px] font-medium text-slate-700 mt-1">
            Order Ref <span className="font-bold text-red-600">{activeEst.estimateNumber}</span> — Instant SMS & WhatsApp receipt has been sent to +91 {activeEst.mobile}. Our Sivakasi packing team is preparing your dispatch!
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
          {STAGES.map((s, i) => {
            const isCompleted = i <= stageIndex;
            return (
              <div key={s.key} className="flex min-w-[110px] flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                    isCompleted
                      ? "bg-red-600 text-white shadow-sm"
                      : "border border-slate-300 bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted && i > 0 ? "✓" : i + 1}
                </span>
                <span className={`text-[11.5px] font-bold transition-all ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                  {s.key}
                </span>
                {i < STAGES.length - 1 && (
                  <span className={`hidden h-px flex-1 sm:block transition-all ${i < stageIndex ? "bg-red-500" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
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
                Phone: {SITE.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[3px] text-red-600">Official Order Invoice</p>
            <p className="font-display text-[22px] font-bold text-slate-900 print:text-black">
              {activeEst.estimateNumber}
            </p>
            <p className="text-[12px] font-medium text-slate-500 print:text-black">
              {new Date(activeEst.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            {(() => {
              const st = String(activeEst.status || "NEW").toUpperCase();
              let badgeCls = "bg-red-50 border-red-200 text-red-600";
              if (st === "DELIVERED") badgeCls = "bg-emerald-100 border-emerald-300 text-emerald-800";
              else if (st === "OUT FOR DELIVERY") badgeCls = "bg-amber-100 border-amber-300 text-amber-800";
              else if (st === "SHIPPED") badgeCls = "bg-blue-100 border-blue-300 text-blue-800";
              else if (st === "PACKAGE READY") badgeCls = "bg-purple-100 border-purple-300 text-purple-800";
              else if (st === "PAYMENT RECEIVED") badgeCls = "bg-emerald-50 border-emerald-300 text-emerald-700";

              return (
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[2px] shadow-xs ${badgeCls}`}>
                  {st === "DELIVERED" ? "✓ DELIVERED" : st === "OUT FOR DELIVERY" ? "🚚 OUT FOR DELIVERY" : st}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 p-8 sm:grid-cols-3">
          <Block title="Customer Details">
            {activeEst.customerName}
            <br />
            +91 {activeEst.mobile}
            {activeEst.email ? <><br />{activeEst.email}</> : null}
            {activeEst.gstNumber ? <><br />GST: {activeEst.gstNumber}</> : null}
          </Block>
          <Block title="Delivery Address">
            {activeEst.address || "—"}
            <br />
            {[activeEst.city, activeEst.district, activeEst.state, activeEst.pincode]
              .filter(Boolean)
              .join(", ")}
          </Block>
          <Block title="Transport & Billing">
            {activeEst.transportName || "Direct Factory Transport"}
            <br />
            {activeEst.deliveryLocation || "Sivakasi Licensed Dispatch"}
            {activeEst.instructions ? <><br />Note: {activeEst.instructions}</> : null}
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
              {activeItems.map((it, i) => (
                <tr key={it.id || i} className="border-b border-slate-100 hover:bg-slate-50">
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
                    {formatINR(Number(it.lineTotal || Number(it.price) * Number(it.quantity)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2 border-t border-slate-200 p-8 text-[13.5px]">
          <Line label="Gross MRP value" value={formatINR(Number(activeEst.mrpTotal))} />
          <Line label="Factory offer subtotal" value={formatINR(Number(activeEst.subtotal))} />
          <Line label="Total savings" value={`- ${formatINR(Number(activeEst.savings))}`} accent />
          {Number(activeEst.discount) > 0 && (
            <Line label={`Coupon ${activeEst.couponCode ?? ""}`} value={`- ${formatINR(Number(activeEst.discount))}`} accent />
          )}
          <Line
            label="Transport charge"
            value={Number(activeEst.transportCharge) === 0 ? "FREE" : formatINR(Number(activeEst.transportCharge))}
          />
          <Line label="GST 18%" value={formatINR(Number(activeEst.gstAmount))} />
          <div className="mt-3 flex w-full max-w-sm items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-[12px] font-bold uppercase tracking-[2px] text-slate-500 print:text-black">
              Grand Total
            </span>
            <span className="font-display text-[26px] font-bold text-red-600">
              {formatINR(Number(activeEst.grandTotal))}
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
          estimateNumber={activeEst.estimateNumber}
          total={formatINR(Number(activeEst.grandTotal))}
          items={activeItems.length}
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
