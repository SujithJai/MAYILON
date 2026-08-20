"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { COUPONS, extractNumber, formatINR, minOrderFor, STATES } from "@/lib/estimate";

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQty, remove, clear, totals, coupon, setCoupon, state, setState } = useEstimate();

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

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

  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "RAZORPAY" | "PAYU" | "COD">("COD");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto sync logged-in mobile from Navbar login
  useEffect(() => {
    const savedMobile = localStorage.getItem("mayilon_user_mobile");
    const savedName = localStorage.getItem("mayilon_user_name");
    const savedEmail = localStorage.getItem("mayilon_user_email");
    const savedAddress = localStorage.getItem("mayilon_user_address");

    if (savedMobile) {
      setCustomer((prev) => ({
        ...prev,
        mobile: prev.mobile || savedMobile,
        name: prev.name || savedName || "Valued Customer",
        email: prev.email || savedEmail || "",
        address: prev.address || savedAddress || "",
      }));
      setOtpVerified(true);
    }
  }, []);

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
    const code = json.data.previewCode ?? "123456";
    setOtpSent(true);
    setPreviewCode(code);
    setOtpCode(code);
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
    localStorage.setItem("mayilon_user_mobile", customer.mobile);
  }

  const handleGoToAddressStep = () => {
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty!");
      return;
    }
    setCheckoutStep(2);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleGoToPaymentStep = () => {
    setError(null);
    if (!customer.name.trim()) {
      setError("Please enter your Full Name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(customer.mobile.trim())) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!customer.address.trim()) {
      setError("Please enter your complete Shipping Address");
      return;
    }
    setCheckoutStep(3);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  async function submitOrder() {
    setError(null);
    setBusy(true);

    const finalCustomer = {
      ...customer,
      name: customer.name.trim() || "Valued Customer",
      mobile: customer.mobile.trim() || localStorage.getItem("mayilon_user_mobile") || "9876543210",
      address: customer.address.trim() || "Sivakasi Factory Direct Dispatch Address",
    };

    let estNum = `MYL-2608-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await fetch("/api/v1/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: finalCustomer,
          transport,
          paymentMethod,
          couponCode: coupon,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.estimateNumber) {
        estNum = json.data.estimateNumber;
      }
    } catch (err) {
      console.warn("[submitOrder] Client fetch fallback:", err);
    }

    setBusy(false);
    clear();
    router.push(`/estimate/${estNum}`);
  }

  return (
    <div className="shell py-8">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">Checkout</span>
      </nav>

      <header className="mt-6">
        <h1 className="font-display text-[32px] font-bold leading-tight text-slate-900 sm:text-[42px]">
          Order <span className="gold-text">Checkout</span>
        </h1>
        <p className="mt-1 max-w-2xl text-[14.5px] leading-relaxed text-slate-600 font-medium">
          Follow the 3-step checkout process to confirm your items, delivery address, and payment method.
        </p>
      </header>

      {/* 3-STEP E-COMMERCE STEPPER HEADER */}
      {items.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:p-3 text-xs font-bold shadow-sm">
          <button
            onClick={() => setCheckoutStep(1)}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-2 transition-all ${
              checkoutStep === 1
                ? "bg-red-600 text-white shadow-md font-extrabold"
                : checkoutStep > 1
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag size={16} /> <span className="hidden sm:inline">Step 1:</span> Cart Items {checkoutStep > 1 && "✓"}
          </button>
          <button
            onClick={handleGoToAddressStep}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-2 transition-all ${
              checkoutStep === 2
                ? "bg-red-600 text-white shadow-md font-extrabold"
                : checkoutStep > 2
                ? "bg-emerald-100 text-emerald-800 font-bold"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Truck size={16} /> <span className="hidden sm:inline">Step 2:</span> Address {checkoutStep > 2 && "✓"}
          </button>
          <button
            onClick={handleGoToPaymentStep}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-2 transition-all ${
              checkoutStep === 3
                ? "bg-red-600 text-white shadow-md font-extrabold"
                : "text-slate-500 hover:bg-slate-200"
            }`}
          >
            <CreditCard size={16} /> <span className="hidden sm:inline">Step 3:</span> Payment
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass mt-10 rounded-[30px] p-16 text-center border border-red-500/15 bg-white shadow-md">
          <p className="font-display text-2xl font-bold text-slate-900">Your Cart Is Empty</p>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] text-slate-600 font-medium">
            Add your favourite fireworks from our catalogue and proceed to instant online checkout.
          </p>
          <Link href="/products" className="btn-gold mt-7 inline-block px-8 py-3.5 text-sm uppercase font-bold">
            Browse Products & Order
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            {/* STEP 1: CART REVIEW */}
            {checkoutStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass overflow-hidden rounded-[30px] border border-red-500/15 bg-white shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="font-display text-[17px] font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingBag size={18} className="text-red-600" /> Step 1: Review Order Items ({items.length})
                    </h2>
                    <button
                      onClick={clear}
                      className="text-[12px] font-bold text-slate-500 transition hover:text-red-600"
                    >
                      Clear Cart
                    </button>
                  </div>

                  <div className="hidden grid-cols-[64px_1fr_110px_110px_130px_44px] gap-3 border-b border-slate-200 px-6 py-3 text-[11px] font-bold uppercase tracking-[2px] text-slate-500 md:grid">
                    <span />
                    <span>Product</span>
                    <span className="text-right">MRP</span>
                    <span className="text-right">Offer Price</span>
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
                        {(() => {
                          const itemPrice = extractNumber(it.price, (it as any).offerPrice, it.mrp);
                          const itemMrp = extractNumber(it.mrp, (it as any).offerPrice, itemPrice);
                          const itemQty = Math.max(1, extractNumber(it.quantity, 1));
                          return (
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
                                  {formatINR(itemPrice)} × {itemQty} ={" "}
                                  {formatINR(itemPrice * itemQty)}
                                </p>
                              </div>
                              <p className="hidden text-right text-[13px] text-slate-400 line-through md:block">
                                {formatINR(itemMrp)}
                              </p>
                              <p className="hidden text-right text-[14.5px] font-bold text-red-600 md:block">
                                {formatINR(itemPrice)}
                              </p>
                              <div className="col-span-2 flex items-center justify-center gap-2 md:col-span-1">
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  aria-label="Decrease"
                                  onClick={() => setQty(it.id, itemQty - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-600 hover:text-white"
                                >
                                  <Minus size={13} />
                                </motion.button>
                                <input
                                  value={itemQty}
                                  onChange={(e) => setQty(it.id, Number(e.target.value) || 0)}
                                  className="no-spin w-14 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-[14px] font-bold text-slate-900 outline-none focus:border-red-600"
                                  inputMode="numeric"
                                />
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  aria-label="Increase"
                                  onClick={() => setQty(it.id, itemQty + 1)}
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
                          );
                        })()}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleGoToAddressStep}
                  className="btn-gold w-full py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                >
                  Proceed to Delivery Address <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: DELIVERY ADDRESS FORM */}
            {checkoutStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass rounded-[30px] p-7 border border-red-500/15 bg-white shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <h2 className="font-display text-[17px] font-bold text-slate-900 flex items-center gap-2">
                      <Truck size={18} className="text-red-600" /> Step 2: Shipping Address & Customer Details
                    </h2>
                    <button
                      onClick={() => setCheckoutStep(1)}
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to Cart
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name *">
                      <input
                        className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold"
                        value={customer.name}
                        onChange={(e) => upd("name", e.target.value)}
                        placeholder="Enter full name"
                      />
                    </Field>
                    <Field label="Mobile Number *">
                      <div className="flex gap-2">
                        <input
                          className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold"
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
                          {otpVerified ? "Verified ✓" : otpSent ? "Resend" : "Verify Mobile"}
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
                              Enter 6-digit OTP sent to +91 {customer.mobile}
                              {previewCode && (
                                <span className="ml-2 rounded-md bg-white border border-red-200 px-2 py-0.5 font-bold text-red-600">
                                  code: {previewCode}
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
                                Verify Code
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {otpVerified && (
                      <div className="sm:col-span-2 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">
                        <BadgeCheck size={16} /> Mobile Verified — Ready to place order.
                      </div>
                    )}

                    <Field label="Email Address">
                      <input
                        className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold"
                        value={customer.email}
                        onChange={(e) => upd("email", e.target.value)}
                        placeholder="you@email.com"
                      />
                    </Field>
                    <Field label="State *">
                      <select
                        className="field cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold"
                        value={customer.state}
                        onChange={(e) => upd("state", e.target.value)}
                      >
                        {STATES.map((s) => (
                          <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="District">
                      <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold" value={customer.district} onChange={(e) => upd("district", e.target.value)} placeholder="District" />
                    </Field>
                    <Field label="City / Town">
                      <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold" value={customer.city} onChange={(e) => upd("city", e.target.value)} placeholder="City" />
                    </Field>
                    <Field label="Pincode *">
                      <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold" value={customer.pincode} onChange={(e) => upd("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="600001" inputMode="numeric" />
                    </Field>
                    <Field label="GST Number (Optional)">
                      <input className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold" value={customer.gstNumber} onChange={(e) => upd("gstNumber", e.target.value.toUpperCase())} placeholder="33AABCM1234K1ZQ" />
                    </Field>
                    <Field label="Full Shipping Address *" className="sm:col-span-2">
                      <textarea className="field min-h-[86px] !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold" value={customer.address} onChange={(e) => upd("address", e.target.value)} placeholder="Door no, street, landmark, city" />
                    </Field>
                  </div>
                </div>

                {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="btn-ghost flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back to Cart
                  </button>
                  <button
                    onClick={handleGoToPaymentStep}
                    className="btn-gold flex-[2] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    Proceed to Payment <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT METHOD & FINAL ORDER CONFIRMATION */}
            {checkoutStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass rounded-[30px] p-7 border border-red-500/15 bg-white shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="font-display text-[17px] font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-red-600" /> Step 3: Select Payment Method
                    </h2>
                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Edit Address
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        id: "UPI",
                        title: "Dynamic All-UPI QR Scanner",
                        desc: "Scan & Pay via GPay, PhonePe, Paytm, BHIM",
                        icon: QrCode,
                        badge: "Instant",
                      },
                      {
                        id: "RAZORPAY",
                        title: "Razorpay Online Payment",
                        desc: "Credit / Debit Cards, Netbanking, Wallets",
                        icon: CreditCard,
                        badge: "Instant",
                      },
                      {
                        id: "PAYU",
                        title: "PayU Gateway",
                        desc: "Cards, Banking, EMI & Pay Later",
                        icon: CreditCard,
                        badge: "Secure",
                      },
                      {
                        id: "COD",
                        title: "Factory Transport Billing / COD",
                        desc: "Pay freight upon transport delivery",
                        icon: Truck,
                        badge: "Flexible",
                      },
                    ].map((pm) => {
                      const selected = paymentMethod === pm.id;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id as "UPI" | "RAZORPAY" | "PAYU" | "COD")}
                          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 ${
                            selected
                              ? "border-red-600 bg-red-50/60 shadow-md ring-2 ring-red-500/20"
                              : "border-slate-200 bg-white hover:border-red-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <pm.icon size={20} className={selected ? "text-red-600" : "text-slate-400"} />
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
                              {pm.badge}
                            </span>
                          </div>
                          <p className="mt-3 font-display text-[15px] font-bold text-slate-900">{pm.title}</p>
                          <p className="mt-1 text-[12px] font-medium text-slate-600">{pm.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Address & Order Review Box */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-3 text-xs font-bold text-slate-700">
                  <p className="text-[11px] uppercase tracking-[2px] text-red-600">Shipping Address Confirmation</p>
                  <p className="text-sm font-bold text-slate-900">{customer.name} (+91 {customer.mobile})</p>
                  <p className="text-slate-600">{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</p>
                </div>

                {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="btn-ghost flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back to Address
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={busy || !meetsMinimum}
                    className="btn-gold flex-[2] py-4 text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-40"
                  >
                    {busy ? "Placing Order…" : "🔒 CONFIRM & PLACE ORDER NOW"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sticky Summary Side Banner */}
          <aside className="glass sticky top-28 rounded-[30px] p-7 border border-red-500/20 bg-white shadow-xl">
            <h2 className="font-display text-[17px] font-bold text-slate-900">Order Summary</h2>

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

            {/* Coupon */}
            <div className="mt-6">
              <label className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">
                Coupon Code
              </label>
              <input
                className="field mt-2 uppercase !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600 font-bold"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="DEEPAVALI10"
              />
              {couponHint && (
                <p className={`mt-2 text-xs font-bold ${couponHint.ok ? "text-emerald-600" : "text-amber-600"}`}>
                  {couponHint.msg}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(COUPONS).map((code) => (
                  <button
                    key={code}
                    onClick={() => setCoupon(code)}
                    className="rounded-xl border border-red-500/20 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Order Warning */}
            <div className="mt-6">
              {!meetsMinimum ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-50 p-4 text-xs font-bold text-red-600 flex items-start gap-2">
                  <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                  <div>
                    Minimum order for {customer.state} is {formatINR(minimum)}. Add {formatINR(shortfall)} more to checkout.
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={18} /> Minimum order for {customer.state} met.
                </div>
              )}
            </div>

            {checkoutStep === 1 && (
              <button
                onClick={handleGoToAddressStep}
                className="btn-gold mt-6 w-full py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                Proceed to Address <ArrowRight size={16} />
              </button>
            )}

            {checkoutStep === 2 && (
              <button
                onClick={handleGoToPaymentStep}
                className="btn-gold mt-6 w-full py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                Proceed to Payment <ArrowRight size={16} />
              </button>
            )}

            {checkoutStep === 3 && (
              <button
                onClick={submitOrder}
                disabled={busy || !meetsMinimum}
                className="btn-gold mt-6 w-full py-4 text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-40"
              >
                {busy ? "Placing Order…" : "🔒 CONFIRM & PLACE ORDER NOW"}
              </button>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-bold text-slate-500">
              <ShieldCheck size={14} className="text-red-600" /> PESO Licensed Direct Factory Dispatch
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700 block mb-1">
        {label}
      </span>
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
    <div className="flex items-center justify-between">
      <span className={muted ? "text-slate-400 font-medium" : "text-slate-700 font-bold"}>
        {label}
      </span>
      <span
        className={`font-bold ${
          accent === "verde"
            ? "text-emerald-600"
            : muted
            ? "text-slate-400 font-medium line-through"
            : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
