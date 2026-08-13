"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { SITE, waLink } from "@/lib/slug";
import { SearchOverlay } from "./SearchOverlay";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/dealers", label: "Wholesale" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const TICKER = [
  "Factory Direct Pricing",
  "80% Off MRP",
  "Premium Sivakasi Quality",
  "Wholesale & Dealer Orders",
  "Festival Offers Live",
  "Safe Packing & Fast Dispatch",
  "PESO Licensed Manufacturer",
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items } = useEstimate();
  const count = items.length;

  // Customer Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [userMobile, setUserMobile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mayilon_user_mobile");
    if (saved) setUserMobile(saved);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSendOtp = async () => {
    setError(null);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    setOtpSent(true);
    setPreviewCode(json.data.previewCode ?? "123456");
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/v1/auth/otp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, code: otpCode }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message);
      return;
    }
    localStorage.setItem("mayilon_user_mobile", mobile);
    setUserMobile(mobile);
    setLoginModalOpen(false);
  };

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[300] print:hidden">
        {/* announcement ticker */}
        <div className="relative h-8 overflow-hidden bg-red-600 text-white font-bold border-b border-red-700 shadow-sm">
          <div className="ticker-track flex w-max items-center gap-10 py-[7px] text-[11px] uppercase tracking-[3px]">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {t}
                <span className="text-red-200">✦</span>
              </span>
            ))}
          </div>
        </div>

        <header
          className={`transition-all duration-500 ${
            scrolled
              ? "border-b border-red-500/20 bg-white/95 backdrop-blur-2xl shadow-md"
              : "border-b border-slate-200/80 bg-white/85 backdrop-blur-md"
          }`}
        >
          <div className="shell flex h-[74px] items-center justify-between gap-4">
            <Link href="/" aria-label="Mayilon Crackers home">
              <LogoLockup />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`group relative rounded-xl px-3.5 py-2 text-[13px] font-bold tracking-[1px] transition-all duration-300 ${
                      active ? "text-red-600" : "text-slate-700 hover:text-red-600"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left bg-red-600 transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:border-red-600 hover:text-red-600"
              >
                <Search size={17} />
              </button>
              <a
                href={`tel:${SITE.phoneRaw}`}
                aria-label="Call Mayilon Crackers"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:border-red-600 hover:text-red-600 sm:flex"
              >
                <Phone size={16} />
              </a>

              <Link
                href="/estimate"
                className="btn-gold relative flex h-10 items-center gap-2 px-4 text-[12.5px] uppercase font-bold"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Cart / Order</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-red-600 shadow">
                    {count}
                  </span>
                )}
              </Link>

              {/* LOGIN BUTTON RIGHT NEXT TO CART / ORDER */}
              <button
                onClick={() => setLoginModalOpen(true)}
                className="btn-ghost flex h-10 items-center gap-1.5 px-3.5 text-[12.5px] font-bold uppercase shadow-sm"
              >
                <User size={16} className="text-red-600" />
                <span className="hidden sm:inline">
                  {userMobile ? `+91 ${userMobile.slice(0, 5)}...` : "Login"}
                </span>
              </button>

              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition lg:hidden"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-slate-200 bg-white p-6 shadow-xl lg:hidden"
              >
                <nav className="flex flex-col gap-3">
                  {LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="rounded-xl p-3 text-[15px] font-bold text-slate-800 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase"
                    >
                      <User size={16} /> {userMobile ? `Logged in (+91 ${userMobile})` : "Customer Login"}
                    </button>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* CUSTOMER LOGIN MODAL */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLoginModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-red-500/20 bg-white p-8 shadow-2xl"
            >
              <button
                onClick={() => setLoginModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
                <User size={24} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">
                {userMobile ? "Customer Profile" : "Customer Mobile Login"}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-600">
                {userMobile
                  ? `Logged in as +91 ${userMobile}. View your live order status and tracking history.`
                  : "Enter your mobile number to receive OTP and access instant order tracking."}
              </p>

              {userMobile ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    <BadgeCheck size={18} /> Logged in: +91 {userMobile}
                  </div>
                  <Link
                    href="/track"
                    onClick={() => setLoginModalOpen(false)}
                    className="btn-gold block text-center py-3 text-xs uppercase font-bold"
                  >
                    Track My Orders
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem("mayilon_user_mobile");
                      setUserMobile(null);
                      setOtpSent(false);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">
                      Mobile Number *
                    </span>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile"
                        inputMode="numeric"
                        className="field !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                      />
                      <button
                        onClick={handleSendOtp}
                        disabled={busy}
                        className="btn-ghost shrink-0 px-4 text-xs font-bold disabled:opacity-40"
                      >
                        {otpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                  </label>

                  {otpSent && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-50 p-4">
                      <p className="text-xs font-medium text-slate-700">
                        Enter 6-digit OTP sent to +91 {mobile}
                        {previewCode && (
                          <span className="ml-2 rounded bg-white px-2 py-0.5 font-bold text-red-600 border border-red-200">
                            code: {previewCode}
                          </span>
                        )}
                      </p>
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        inputMode="numeric"
                        className="field mt-2 tracking-[6px] !bg-white !text-slate-900 font-bold"
                      />
                    </div>
                  )}

                  {error && <p className="text-xs font-bold text-red-600">{error}</p>}

                  {otpSent && (
                    <button
                      onClick={handleVerifyOtp}
                      disabled={busy}
                      className="btn-gold w-full py-3.5 text-sm uppercase font-bold"
                    >
                      Verify OTP & Login
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
