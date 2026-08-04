import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  return { title: `Estimate ${number}`, robots: { index: false, follow: false } };
}

const STAGES = ["NEW", "PENDING", "APPROVED", "CONVERTED", "PACKING", "DISPATCHED", "DELIVERED"];

export default async function EstimateConfirmation({ params }: { params: Params }) {
  const { number } = await params;
  const [estimate] = await db
    .select()
    .from(estimates)
    .where(eq(estimates.estimateNumber, number))
    .limit(1);
  if (!estimate) notFound();

  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, estimate.id));

  const stageIndex = Math.max(0, STAGES.indexOf(estimate.status));

  return (
    <div className="shell py-10">
      <div className="glass mb-8 flex flex-wrap items-center gap-4 rounded-[26px] border-verde/35 bg-verde/6 p-6 print:hidden">
        <CheckCircle2 size={26} className="text-verde" />
        <div className="flex-1">
          <p className="font-display text-[19px] font-semibold text-white">
            Estimate submitted successfully
          </p>
          <p className="text-[13px] text-white/55">
            Reference <span className="text-gold">{estimate.estimateNumber}</span> — our Sivakasi
            sales desk will confirm stock and pricing within 24 hours on {estimate.mobile}.
          </p>
        </div>
        <Link href="/products" className="btn-ghost px-6 py-3 text-[12.5px] uppercase">
          Continue browsing
        </Link>
      </div>

      {/* status tracker */}
      <div className="glass mb-8 rounded-[26px] p-6 print:hidden">
        <p className="mb-5 text-[11px] uppercase tracking-[3px] text-gold">Order workflow</p>
        <div className="flex flex-wrap gap-y-4">
          {STAGES.map((s, i) => (
            <div key={s} className="flex min-w-[110px] flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  i <= stageIndex
                    ? "bg-gold text-black shadow-[0_0_18px_-4px_rgba(212,175,55,0.9)]"
                    : "border border-white/15 text-white/35"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[11.5px] ${i <= stageIndex ? "text-white" : "text-white/35"}`}>
                {s}
              </span>
              {i < STAGES.length - 1 && (
                <span className={`hidden h-px flex-1 sm:block ${i < stageIndex ? "bg-gold/70" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* document */}
      <div className="glass overflow-hidden rounded-[30px] print:border-0 print:bg-white print:text-black">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gold/20 p-8">
          <div className="flex items-center gap-4">
            <LogoMark size={54} />
            <div>
              <p className="gold-text font-display text-[20px] font-bold uppercase tracking-[3px] print:text-black">
                Mayilon Crackers
              </p>
              <p className="text-[11.5px] text-white/45 print:text-black">{SITE.address}</p>
              <p className="text-[11.5px] text-white/45 print:text-black">
                GSTIN {SITE.gst} · {SITE.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[3px] text-gold">Estimate</p>
            <p className="font-display text-[22px] font-bold text-white print:text-black">
              {estimate.estimateNumber}
            </p>
            <p className="text-[12px] text-white/45 print:text-black">
              {new Date(estimate.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <span className="mt-2 inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] uppercase tracking-[2px] text-gold">
              {estimate.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 border-b border-white/8 p-8 sm:grid-cols-3">
          <Block title="Billed to">
            {estimate.customerName}
            <br />
            {estimate.mobile}
            {estimate.email ? <><br />{estimate.email}</> : null}
            {estimate.gstNumber ? <><br />GST: {estimate.gstNumber}</> : null}
          </Block>
          <Block title="Delivery">
            {estimate.address || "—"}
            <br />
            {[estimate.city, estimate.district, estimate.state, estimate.pincode]
              .filter(Boolean)
              .join(", ")}
          </Block>
          <Block title="Transport">
            {estimate.transportName || "To be assigned"}
            <br />
            {estimate.deliveryLocation || "Nearest transport office"}
            {estimate.instructions ? <><br />Note: {estimate.instructions}</> : null}
          </Block>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10.5px] uppercase tracking-[2px] text-white/40 print:text-black">
                <th className="px-8 py-3">#</th>
                <th className="py-3">Product</th>
                <th className="py-3">Code</th>
                <th className="py-3 text-right">MRP</th>
                <th className="py-3 text-right">Rate</th>
                <th className="py-3 text-center">Qty</th>
                <th className="px-8 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-b border-white/5">
                  <td className="px-8 py-3 text-white/35 print:text-black">{i + 1}</td>
                  <td className="py-3">
                    <p className="text-white print:text-black">{it.name}</p>
                    <p className="text-[11px] text-white/35 print:text-black">
                      {it.categoryName} · {it.packing}
                    </p>
                  </td>
                  <td className="py-3 text-white/50 print:text-black">{it.sku}</td>
                  <td className="py-3 text-right text-white/35 line-through print:text-black">
                    {formatINR(Number(it.mrp))}
                  </td>
                  <td className="py-3 text-right text-gold">{formatINR(Number(it.price))}</td>
                  <td className="py-3 text-center text-white print:text-black">{it.quantity}</td>
                  <td className="px-8 py-3 text-right font-semibold text-white print:text-black">
                    {formatINR(Number(it.lineTotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-2 border-t border-white/8 p-8 text-[13.5px]">
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
          <div className="mt-3 flex w-full max-w-sm items-center justify-between border-t border-gold/30 pt-3">
            <span className="text-[12px] uppercase tracking-[2px] text-white/55 print:text-black">
              Grand total
            </span>
            <span className="font-display text-[26px] font-bold text-gold">
              {formatINR(Number(estimate.grandTotal))}
            </span>
          </div>
        </div>

        <div className="border-t border-white/8 p-8 text-[11.5px] leading-relaxed text-white/40 print:text-black">
          <p className="mb-2 font-semibold uppercase tracking-[2px] text-gold">Terms</p>
          1. This is an estimate, not a tax invoice. Prices are valid for 7 days and subject to stock
          confirmation. 2. Goods are dispatched only after offline confirmation and payment as per
          PESO and state regulations. 3. Transport charges are indicative; actuals are billed at
          cost by the transporter. 4. Fireworks are sold for outdoor use by adults only. 5. Claims
          for damage must be raised within 24 hours of delivery with photographic proof.
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
      <p className="mb-2 text-[10.5px] uppercase tracking-[3px] text-gold">{title}</p>
      <p className="text-[13px] leading-relaxed text-white/70 print:text-black">{children}</p>
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex w-full max-w-sm items-center justify-between">
      <span className="text-white/45 print:text-black">{label}</span>
      <span className={accent ? "text-verde" : "text-white/85 print:text-black"}>{value}</span>
    </div>
  );
}
