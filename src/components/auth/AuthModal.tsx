"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/estimate";
import { LogoLockup } from "@/components/brand/Logo";

export function AuthModal({
  isOpen,
  onClose,
  userMobile,
  onLoginSuccess,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  userMobile: string | null;
  onLoginSuccess: (mobile: string) => void;
  onLogout: () => void;
}) {
  const [authType, setAuthType] = useState<"PHONE" | "EMAIL">("PHONE");
  const [step, setStep] = useState<"MOBILE" | "OTP">("MOBILE");
  const [mobile, setMobile] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Profile & Orders State
  const [profileTab, setProfileTab] = useState<"ORDERS" | "PROFILE">("ORDERS");
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fullName, setFullName] = useState("Valued Customer");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const loadUserOrders = async (userMob: string) => {
    try {
      setLoadingOrders(true);
      const clean = userMob.replace(/\D/g, "").slice(-10);
      const res = await fetch(`/api/v1/estimates?mobile=${encodeURIComponent(clean)}`, { cache: "no-store" });
      const json = await res.json();
      let list = json?.success && Array.isArray(json?.data?.items) ? json.data.items : [];

      try {
        const localRaw = typeof window !== "undefined" ? localStorage.getItem("mayilon_recent_orders") : null;
        if (localRaw) {
          const localOrders = JSON.parse(localRaw);
          if (Array.isArray(localOrders) && localOrders.length > 0) {
            const map = new Map();
            for (const o of list) map.set(o.estimateNumber, o);
            for (const o of localOrders) {
              const oMobile = (o.mobile || "").replace(/\D/g, "").slice(-10);
              if (oMobile === clean && o.estimateNumber && !map.has(o.estimateNumber)) {
                map.set(o.estimateNumber, o);
              }
            }
            list = Array.from(map.values());
          }
        }
      } catch {}

      setUserOrders(list);
    } catch (err) {
      console.warn("Failed to load user orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isOpen && userMobile) {
      void loadUserOrders(userMobile);
      const interval = setInterval(() => {
        void loadUserOrders(userMobile);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userMobile]);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Resend Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "OTP" && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  useEffect(() => {
    const savedName = localStorage.getItem("mayilon_user_name");
    const savedEmail = localStorage.getItem("mayilon_user_email");
    const savedAddress = localStorage.getItem("mayilon_user_address");
    if (savedName) setFullName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedAddress) setAddress(savedAddress);
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mobile.trim() }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    if (json.data?.previewCode) {
      setPreviewCode(json.data.previewCode);
    } else {
      setPreviewCode(null);
    }
    setOtpDigits(["", "", "", "", "", ""]);
    setStep("OTP");
    setResendTimer(60);
  };

  const handleSendEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userEmailInput.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setEmailSent(true);
    setEmail(userEmailInput);
    onLoginSuccess(userEmailInput);
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.slice(-1).replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    if (char && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    const code = otpDigits.join("");
    if (code.length < 4) {
      setError("Please enter complete 6-digit OTP code");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: mobile.trim(), code }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    onLoginSuccess(mobile.trim());
    onClose();
  };

  const handleSaveProfile = () => {
    localStorage.setItem("mayilon_user_name", fullName);
    localStorage.setItem("mayilon_user_email", email);
    localStorage.setItem("mayilon_user_address", address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full overflow-hidden rounded-[34px] border border-red-500/20 bg-white p-6 sm:p-8 shadow-2xl transition-all ${userMobile ? "max-w-lg" : "max-w-md"}`}
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-600 hover:text-white"
          >
            <X size={16} />
          </button>

          {/* USER PROFILE & ORDERS VIEW (IF LOGGED IN) */}
          {userMobile ? (
            <div className="space-y-4">
              {/* Top User Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white font-bold shadow-md">
                    <User size={22} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 leading-tight">{fullName}</h2>
                    <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                      <Phone size={11} /> {userMobile.includes("@") ? userMobile : `+91 ${userMobile}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                  title="Sign out from this device"
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>

              {/* Sub-tab Switcher: My Orders vs Profile */}
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setProfileTab("ORDERS")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                    profileTab === "ORDERS"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Package size={14} /> My Orders ({userOrders.length})
                </button>
                <button
                  onClick={() => setProfileTab("PROFILE")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                    profileTab === "PROFILE"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <User size={14} /> Profile & Address
                </button>
              </div>

              {/* TAB 1: MY ORDERS & LIVE TRACKING */}
              {profileTab === "ORDERS" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck size={14} /> Records permanently bound to mobile
                    </span>
                    <button
                      onClick={() => userMobile && loadUserOrders(userMobile)}
                      className="flex items-center gap-1 text-red-600 hover:underline"
                    >
                      <RefreshCw size={11} className={loadingOrders ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>

                  {loadingOrders && userOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      <p className="mt-2 text-xs font-bold text-slate-600">Retrieving order history from server...</p>
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                      <Package size={32} className="mx-auto text-slate-400" />
                      <p className="mt-2 text-xs font-bold text-slate-700">No orders placed yet</p>
                      <p className="text-[11px] text-slate-500">Orders placed with +91 {userMobile} will permanently appear here across all devices.</p>
                      <Link
                        href="/products"
                        onClick={onClose}
                        className="btn-gold mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase"
                      >
                        <ShoppingBag size={13} /> Shop Festival Crackers
                      </Link>
                    </div>
                  ) : (
                    <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
                      {userOrders.map((ord: any) => {
                        const status = (ord.status || "NEW").toUpperCase();
                        const isPaid = ord.paymentStatus === "PAID";
                        const grandTotal = Number(ord.grandTotal) || 0;

                        let badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                        let statusLabel = "Order Placed";
                        if (status === "PACKAGE READY") {
                          badgeColor = "bg-purple-100 text-purple-800 border-purple-300";
                          statusLabel = "Packaged";
                        } else if (status === "SHIPPED") {
                          badgeColor = "bg-blue-100 text-blue-800 border-blue-300";
                          statusLabel = "Dispatched / Shipped";
                        } else if (status === "OUT FOR DELIVERY") {
                          badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
                          statusLabel = "Out for Delivery";
                        } else if (status === "DELIVERED") {
                          badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
                          statusLabel = "Delivered";
                        }

                        return (
                          <div
                            key={ord.estimateNumber || ord.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs hover:border-red-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black text-slate-900">
                                {ord.estimateNumber}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${badgeColor}`}>
                                {statusLabel}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN") : "Recent Order"} · {ord.itemCount || (ord.items?.length ?? 1)} items
                              </span>
                              <span className="font-display font-black text-red-600">
                                {formatINR(grandTotal)}
                              </span>
                            </div>

                            {/* Payment status badge & actions */}
                            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                              <span className={`flex items-center gap-1 font-bold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>
                                {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                {isPaid ? "Payment Confirmed" : "Payment Verification"}
                              </span>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/estimate/${ord.estimateNumber}`}
                                  onClick={onClose}
                                  className="text-[11px] font-bold text-slate-700 hover:text-red-600 flex items-center gap-0.5"
                                >
                                  Bill <ExternalLink size={10} />
                                </Link>
                                <Link
                                  href="/track"
                                  onClick={onClose}
                                  className="rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-[10.5px] font-bold text-red-600 hover:bg-red-100 flex items-center gap-1"
                                >
                                  <Truck size={11} /> Track
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Link
                    href="/track"
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                  >
                    <Truck size={14} /> Open Full Live Tracking Portal
                  </Link>
                </div>
              ) : (
                /* TAB 2: PROFILE DETAILS FORM */
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <BadgeCheck size={18} /> Verified Account Session Active
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Full Name</span>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="field mt-1 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Email Address</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="field mt-1 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Shipping Address</span>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Door no, street, city, pincode"
                      className="field mt-1 min-h-[70px] !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <button
                    onClick={handleSaveProfile}
                    className="btn-gold w-full py-3 text-xs uppercase font-bold"
                  >
                    Save Profile Details
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* STEP 1: LOGIN TYPE (PHONE OR EMAIL) */
            step === "MOBILE" ? (
              <div className="space-y-6">
                <div>
                  <LogoLockup size={40} />
                  <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Login via Phone OTP or Email to track & place orders.
                  </p>
                </div>

                {/* Tab Switcher: Phone vs Email */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
                  <button
                    onClick={() => setAuthType("PHONE")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all ${
                      authType === "PHONE" ? "bg-white text-red-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Phone size={14} /> Phone OTP
                  </button>
                  <button
                    onClick={() => setAuthType("EMAIL")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all ${
                      authType === "EMAIL" ? "bg-white text-red-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Mail size={14} /> Email Login
                  </button>
                </div>

                {authType === "PHONE" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700 block">
                        Mobile Number *
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 px-4 font-bold text-slate-800 text-sm">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Enter mobile number"
                          inputMode="numeric"
                          className="field flex-1 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold text-base tracking-wider"
                        />
                      </div>
                    </div>

                    {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-gold w-full py-4 text-sm uppercase font-bold tracking-wider"
                    >
                      {busy ? "Sending OTP…" : "CONTINUE WITH OTP"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSendEmailAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700 block">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={userEmailInput}
                        onChange={(e) => setUserEmailInput(e.target.value)}
                        placeholder="you@domain.com"
                        className="field w-full !bg-slate-50 !border-slate-300 !text-slate-900 font-bold text-sm"
                      />
                    </div>

                    {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                    <button
                      type="submit"
                      className="btn-gold w-full py-4 text-sm uppercase font-bold tracking-wider"
                    >
                      LOGIN WITH EMAIL
                    </button>
                  </form>
                )}

                <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-slate-500 pt-2">
                  <Lock size={14} className="text-red-600" /> Secure Supabase & SMS Auth
                </p>
              </div>
            ) : (
              /* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep("MOBILE")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Verify Your Number</h2>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    OTP sent to <span className="font-bold text-red-600">+91 {mobile}</span>
                  </p>

                  {previewCode && (
                    <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-50 p-3 text-[11.5px] font-bold text-amber-800">
                      💡 Fast2SMS Note: Fast2SMS account requires ₹100 initial recharge to send SMS to phone. Use test code <span className="underline decoration-amber-600 font-extrabold text-red-600">[{previewCode}]</span> to verify!
                    </div>
                  )}
                </div>

                {/* 6 Individual Digit Inputs */}
                <div className="flex justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="h-13 w-12 rounded-2xl border border-slate-300 bg-slate-50 text-center text-xl font-bold text-slate-900 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  ))}
                </div>

                {/* Resend Timer Lock */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">
                    {resendTimer > 0 ? `Resend in 00:${resendTimer.toString().padStart(2, "0")}` : "Didn't receive OTP?"}
                  </span>
                  <button
                    type="button"
                    disabled={!canResend || busy}
                    onClick={handleSendOtp}
                    className="text-red-600 disabled:opacity-40 hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gold w-full py-4 text-sm uppercase font-bold tracking-wider"
                >
                  {busy ? "Verifying…" : "VERIFY"}
                </button>
              </form>
            )
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
