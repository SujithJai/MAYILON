"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Building,
  Heart,
  Lock,
  LogOut,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userMobile: string | null;
  onLoginSuccess: (mobile: string) => void;
  onLogout: () => void;
};

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
  const [step, setStep] = useState<"MOBILE" | "OTP">("MOBILE");
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Profile Form State
  const [fullName, setFullName] = useState("Valued Customer");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

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
    const code = json.data.previewCode ?? "123456";
    setPreviewCode(code);
    const codeArray = code.slice(0, 6).split("");
    setOtpDigits(codeArray);
    setStep("OTP");
    setResendTimer(60);
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
          className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-red-500/20 bg-white p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-600 hover:text-white"
          >
            <X size={16} />
          </button>

          {/* USER PROFILE VIEW (IF LOGGED IN) */}
          {userMobile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white font-bold shadow-md">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">{fullName}</h2>
                  <p className="text-xs font-bold text-red-600">+91 {userMobile}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <BadgeCheck size={18} /> Supabase Phone Auth Session Active
              </div>

              <div className="space-y-3 pt-2">
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
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/track"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-50 py-3 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  <Package size={16} /> My Orders
                </Link>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <ShoppingBag size={16} /> Shop Products
                </Link>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="btn-gold flex-1 py-3 text-xs uppercase font-bold"
                >
                  Save Profile Details
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: MOBILE NUMBER ENTRY */
            step === "MOBILE" ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <LogoLockup size={40} />
                  <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    Login to continue shopping & access instant order tracking.
                  </p>
                </div>

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

                <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-slate-500 pt-2">
                  <Lock size={14} className="text-red-600" /> Secure Passwordless Phone Auth
                </p>
              </form>
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
                    <div className="mt-2 inline-block rounded-xl border border-red-500/20 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                      Code: {previewCode}
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
