"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { COUPONS, formatINR, minOrderFor, STATES } from "@/lib/estimate";

type Customer = {
  name: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  address: string;
  gstNumber: string;
  dealerName: string;
};

export default function EstimatePage() {
  const router = useRouter();
  const { items, setQty, remove, clear, totals, coupon, setCoupon, state, setState } = useEstimate();

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    mobile: "",
    email: "",
    state: "Tamil Nadu",
    district: "",
    city: "",
    pincode: "",
    address: "",
    gstNumber: "",
    dealerName: "",
  });
  const [transport, setTransport] = useState({
    transportName: "",
    deliveryLocation: "",
    instructions: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minimum = minOrderFor(customer.state);
  const shortfall = Math.max(0, minimum - totals.subtotal);
  const meetsMinimum = totals.subtotal >= minimum && items.length > 0;

  const couponHint = useMemo(() => {
    const c = COUPONS[coupon.trim().toUpperCase()];
    if (!coupon.trim()) return null;
    if (!c) return { ok: false, msg: "Invalid coupon code" };
    if (totals.subtotal < c.minValue)
      return { ok: false, msg: `${c.label} — needs ${formatINR(c.minValue)} subtotal` };
    return { ok: true, msg: c.label };
  }, [coupon, totals.subtotal]);

  function upd<K extends keyof Customer>(k: K, v: string) {
    setCustomer((c) => ({ ...c, [k]: v }));
    if (k === "state") setState(v);
    if (k === "mobile") {
      setOtpVerified(false);
      setOtpSent(false);
    }
  }

  async function sendOtp() {
    setError(null);
    if (!/^[6-9]\d{9}$/.test(customer.mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: customer.mobile }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    setOtpSent(true);
    setPreviewCode(json.data.previewCode ?? null);
  }

  async function verifyOtp() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: customer.mobile, code: otpCode }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    setOtpVerified(true);
  }

  async function submit() {
    setError(null);
    if (!otpVerified) {
      setError("Please verify your mobile number with OTP before submitting.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        transport,
        couponCode: coupon,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    clear();
    router.push(`/estimate/${json.data.estimateNumber}`);
  }

  return (
    <div className="shell py-8">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">Quick Estimate</span>
      </nav>

      <div className="glass mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/25 bg-white px-5 py-3 text.5px] font-medium text-slate-700 shadow-sm">
        <AlertTriangle size={16} className="text-red-600" />
        Online sale of firecrackers is restricted by law. This is an{" "}
        <span className="font-bold text-red-600">Estimate Request</span> — our Sivakasi desk confirms stock,
        pricing and dispatch offline. No online payment is collected.
      </div>

      <header className="mt-8">
        <h1 className="font-display text-[34px] font-bold leading-tight text-slate-900 sm:text-[44px]">
          Build Your <span className="gold-text">Estimate</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600 font-medium">
          Adjust quantities, apply a festival coupon, verify your mobile and submit. You will get a
          reference number instantly plus a WhatsApp confirmation from our sales desk.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="glass mt-10 rounded-[30px] p-16 text-center border border-red-500/15 bg-white shadow-md">
          <p className="font-display text-2xl font-bold text-slate-900">Your Estimate Is Empty</p>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] text-slate-600 font-medium">
            Add products from the catalogue and they will appear here with live pricing, savings and
            transport calculation.
          </p>
          <Link href="/products" className="btn-gold mt-7 inline-block px-8 py-3.5 text-sm uppercase font-bold">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_390px]">
          <div className="space-y-8">
            {/* Items */}
            <div className="glass overflow-hidden rounded-[30px] border border-red-500/15 bg-white shadow-md">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="font-display text-[17px] font-bold text-slate-900">
                  Selected Products ({items.length})
                </h2>
                <button
                  onClick={clear}
                  className="text-[12px] font-bold text-slate-500 transition hover:text-red-600"
                >
                  Clear All
                </button>
              </div>

              <div className="hidden grid-cols-[64px_1fr_110px_110px_130px_44px] gap-3 border-b border-slate-100 px-6 py-3 text-[10.5px] font-bold uppercase tracking-[2px] text-slate-500 md:grid">
                <span>Image</span>
                <span>Product</span>
                <span className="text-right">MRP</span>
                <span className="text-right">Offer</span>
                <span className="text-center">Qty</span>
                <span />
              </div>

              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.div
                    key={it.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <div className="grid grid-cols-[64px_1fr] items-center gap-3 px-6 py-4 md:grid-cols-[64px_1fr_110px_110px_130px_44px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.imageUrl ?? ""}
                        alt={it.name}
                        className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/products/${it.slug}`}
                          className="truncate text-[14px] font-bold text-slate-900 hover:text-red-600"
                        >
                          {it.name}
                        </Link>
                        <p className="text-[11px] font-bold uppercase tracking-[1.6px] text-slate-500">
                          {it.sku} · {it.packing} · {it.categoryName}
                        </p>
                        <p className="mt-1 text-[12.5px] font-bold text-red-600 md:hidden">
                          {formatINR(it.price)} × {it.quantity} ={" "}
                          {formatINR(it.price * it.quantity)}
                        </p>
                      </div>
                      <p className="hidden text-right text-[13px] text-slate-400 line-through md:block">
                        {formatINR(it.mrp)}
                      </p>
                      <p className="hidden text-right text-[14.5px] font-bold text-red-600 md:block">
                        {formatINR(it.price)}
                      </p>
                      <div className="col-span-2 flex items-center justify-center gap-2 md:col-span-1">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          aria-label="Decrease"
                          onClick={() => setQty(it.id, it.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          <Minus size={13} />
                        </motion.button>
                        <input
                          value={it.quantity}
                          onChange={(e) => setQty(it.id, Number(e.target.value) || 0)}
                          className="no-spin w-14 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-[14px] font-bold text-slate-900 outline-none focus:border-red-600"
                          inputMode="numeric"
                        />
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          aria-label="Increase"
                          onClick={() => setQty(it.id, it.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          <Plus size={13} />
                        </motion.button>
                      </div>
                      <button
                        onClick={() => remove(it.id)}
                        aria-label={`Remove ${it.name}`}
                        className="hidden justify-self-end text-slate-400 transition hover:text-red-600 md:block"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Customer */}
            <div className="glass rounded-[30px] p-7 border border-red-500/15 bg-white shadow-md">
              <h2 className="font-display text-[17px] font-bold text-slate-900">
                Customer Details
              </h2>
              <p className="mt-1 text-[12.5px] font-medium text-slate-600">
                Required so our sales desk can confirm stock and arrange transport.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.name} onChange={(e) => upd("name", e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Mobile Number *">
                  <div className="flex gap-2">
                    <input
                      className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
                      value={customer.mobile}
                      onChange={(e) => upd("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit mobile"
                      inputMode="numeric"
                    />
                    <button
                      onClick={sendOtp}
                      disabled={busy || otpVerified}
                      className="btn-ghost shrink-0 px-4 text-[12px] font-bold disabled:opacity-40"
                    >
                      {otpVerified ? "Verified" : otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </Field>

                <AnimatePresence>
                  {otpSent && !otpVerified && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="sm:col-span-2"
                    >
                      <div className="rounded-2xl border border-red-500/30 bg-red-50 p-4">
                        <p className="text-[12.5px] font-medium text-slate-700">
                          Enter the 6-digit OTP sent to +91 {customer.mobile}
                          {previewCode && (
                            <span className="ml-2 rounded-md bg-white border border-red-200 px-2 py-0.5 font-bold text-red-600">
                              preview code: {previewCode}
                            </span>
                          )}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <input
                            className="field max-w-[180px] tracking-[6px] !bg-white !text-slate-900 font-bold"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="••••••"
                            inputMode="numeric"
                          />
                          <button onClick={verifyOtp} disabled={busy} className="btn-gold px-6 text-[12.5px] font-bold">
                            Verify
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {otpVerified && (
                  <div className="sm:col-span-2 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">
                    <BadgeCheck size={16} /> Mobile verified — you can submit this estimate.
                  </div>
                )}

                <Field label="Email">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@email.com" />
                </Field>
                <Field label="State *">
                  <select
                    className="field cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
                    value={customer.state}
                    onChange={(e) => upd("state", e.target.value)}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="District">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.district} onChange={(e) => upd("district", e.target.value)} placeholder="District" />
                </Field>
                <Field label="City / Town">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.city} onChange={(e) => upd("city", e.target.value)} placeholder="City" />
                </Field>
                <Field label="Pincode">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.pincode} onChange={(e) => upd("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="600001" inputMode="numeric" />
                </Field>
                <Field label="GST Number (optional)">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.gstNumber} onChange={(e) => upd("gstNumber", e.target.value.toUpperCase())} placeholder="33AABCM1234K1ZQ" />
                </Field>
                <Field label="Full Address" className="sm:col-span-2">
                  <textarea className="field min-h-[86px] !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={customer.address} onChange={(e) => upd("address", e.target.value)} placeholder="Door no, street, landmark" />
                </Field>
              </div>
            </div>

            {/* Transport */}
            <div className="glass rounded-[30px] p-7 border border-red-500/15 bg-white shadow-md">
              <h2 className="font-display text-[17px] font-bold text-slate-900">
                Transport Preference
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Preferred Transport Company">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={transport.transportName} onChange={(e) => setTransport((t) => ({ ...t, transportName: e.target.value }))} placeholder="e.g. KPN / SRMT / ARC" />
                </Field>
                <Field label="Nearest Delivery Office">
                  <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={transport.deliveryLocation} onChange={(e) => setTransport((t) => ({ ...t, deliveryLocation: e.target.value }))} placeholder="Transport office / location" />
                </Field>
                <Field label="Special Instructions" className="sm:col-span-2">
                  <textarea className="field min-h-[80px] !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={transport.instructions} onChange={(e) => setTransport((t) => ({ ...t, instructions: e.target.value }))} placeholder="Delivery timing, contact person, packing notes…" />
                </Field>
              </div>
            </div>
          </div>

          {/* Sticky summary */}
          <aside className="glass sticky top-28 rounded-[30px] p-7 border border-red-500/20 bg-white shadow-xl">
            <h2 className="font-display text-[17px] font-bold text-slate-900">Estimate Summary</h2>

            <div className="mt-5 space-y-2.5 text-[13.5px]">
              <Row label={`Items (${totals.itemCount} products / ${totals.units} units)`} value={formatINR(totals.mrpTotal)} muted />
              <Row label="Factory offer price" value={formatINR(totals.subtotal)} />
              <Row label="You save" value={`- ${formatINR(totals.savings)}`} accent="verde" />
              {totals.discount > 0 && (
                <Row label={`Coupon (${coupon.toUpperCase()})`} value={`- ${formatINR(totals.discount)}`} accent="verde" />
              )}
              <Row
                label="Transport charge"
                value={totals.transportCharge === 0 ? "FREE" : formatINR(totals.transportCharge)}
              />
              <Row label="GST 18%" value={formatINR(totals.gstAmount)} />
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-5">
              <span className="text-[12px] font-bold uppercase tracking-[2px] text-slate-500">Grand Total</span>
              <span className="font-display text-[30px] font-bold text-red-600">
                {formatINR(totals.grandTotal)}
              </span>
            </div>

            {/* coupon */}
            <div className="mt-6">
              <label className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">
                Coupon Code
              </label>
              <input
                className="field mt-2 uppercase !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="DEEPAVALI10"
              />
              {couponHint && (
                <p className={`mt-2 text-[12px] font-bold ${couponHint.ok ? "text-emerald-600" : "text-amber-600"}`}>
                  {couponHint.msg}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.keys(COUPONS).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCoupon(c)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-600 transition hover:border-red-500 hover:text-red-600"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* minimum order */}
            <div
              className={`mt-6 rounded-2xl border p-4 text-[12.5px] font-bold ${
                meetsMinimum
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
                  : "border-red-500/40 bg-red-50 text-red-700"
              }`}
            >
              {meetsMinimum ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} /> Minimum order for {customer.state} met.
                </span>
              ) : (
                <span className="flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  Minimum order for {customer.state} is {formatINR(minimum)}. Add{" "}
                  {formatINR(shortfall)} more to submit.
                </span>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-50 p-3 text-[12.5px] font-bold text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={!meetsMinimum || busy || !customer.name || !otpVerified}
              className="btn-gold mt-6 w-full py-3.5 text-sm uppercase font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Submit Estimate"}
            </button>

            <Link href="/products" className="btn-ghost mt-3 block w-full py-3 text-center text-[13px] uppercase font-bold">
              Add More Products
            </Link>

            <p className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-500 font-medium">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
              OTP verified, rate-limited and server-revalidated. Prices are recalculated on our
              server at submission — displayed totals are indicative until confirmed.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: "verde";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-600 font-medium">{label}</span>
      <span
        className={
          accent === "verde"
            ? "font-bold text-emerald-600"
            : muted
              ? "text-slate-400 line-through"
              : "font-bold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
