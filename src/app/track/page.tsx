"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Package,
  Receipt,
  RefreshCw,
  Search,
  Truck,
  User,
} from "lucide-react";
import { formatINR } from "@/lib/estimate";
import { SITE, waLink } from "@/lib/slug";
import { AuthModal } from "@/components/auth/AuthModal";

const STAGES = [
  { key: "NEW", label: "Order Placed", desc: "Received at Sivakasi" },
  { key: "PACKAGE READY", label: "Packaged", desc: "Quality sealed & packed" },
  { key: "SHIPPED", label: "Dispatched", desc: "Handed to licensed transporter" },
  { key: "OUT FOR DELIVERY", label: "Out for Delivery", desc: "On the way to your door" },
  { key: "DELIVERED", label: "Delivered", desc: "Successfully delivered" },
];

export default function TrackPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Customer Orders State
  const [userMobile, setUserMobile] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Read saved mobile on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mob = localStorage.getItem("mayilon_user_mobile");
      if (mob) setUserMobile(mob);
    }
  }, []);

  const loadCustomerOrders = useCallback(async (mobile: string) => {
    setLoadingOrders(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      const res = await fetch(`/api/v1/estimates?mobile=${encodeURIComponent(cleanMobile)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      let list = json?.success && Array.isArray(json?.data?.items) ? json.data.items : [];

      // Also merge with client local storage fallback if any
      try {
        const localRaw = localStorage.getItem("mayilon_recent_orders");
        if (localRaw) {
          const localOrders = JSON.parse(localRaw);
          if (Array.isArray(localOrders) && localOrders.length > 0) {
            const map = new Map();
            for (const o of list) map.set(o.estimateNumber, o);
            for (const o of localOrders) {
              const oMobile = (o.mobile || "").replace(/\D/g, "").slice(-10);
              if (oMobile === cleanMobile && o.estimateNumber && !map.has(o.estimateNumber)) {
                map.set(o.estimateNumber, o);
              }
            }
            list = Array.from(map.values());
          }
        }
      } catch {}

      setCustomerOrders(list);
    } catch (err) {
      console.warn("Failed to load customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Fetch customer orders and set 5s live polling
  useEffect(() => {
    if (!userMobile) return;
    void loadCustomerOrders(userMobile);

    const interval = setInterval(() => {
      void loadCustomerOrders(userMobile);
    }, 5000);
    return () => clearInterval(interval);
  }, [userMobile, loadCustomerOrders]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ref.trim()) {
      setError("Please enter an estimate or order reference number");
      return;
    }
    setBusy(true);
    try {
      const cleanRef = ref.trim().toUpperCase();
      const res = await fetch(`/api/v1/estimates/${encodeURIComponent(cleanRef)}`);
      const json = await res.json();
      if (!json.success || !json.data?.estimate) {
        setError(`No estimate found with reference number "${cleanRef}". Please verify the number.`);
        setBusy(false);
        return;
      }
      router.push(`/estimate/${json.data.estimate.estimateNumber}`);
    } catch {
      setError("Unable to connect to order server. Please try again.");
      setBusy(false);
    }
  }

  const getStageIndex = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED") return 4;
    if (s === "OUT FOR DELIVERY") return 3;
    if (s === "SHIPPED") return 2;
    if (s === "PACKAGE READY") return 1;
    return 0; // NEW or PAYMENT RECEIVED
  };

  return (
    <div className="shell py-10 max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">My Orders & Live Tracking</span>
      </nav>

      {/* Header Banner */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-600">
            <Truck size={13} /> Live Sivakasi Dispatch Tracker
          </span>
          <h1 className="mt-2 font-display text-[28px] sm:text-[36px] font-black text-slate-900 leading-tight">
            My Orders & <span className="gold-text">Live Tracking</span>
          </h1>
          <p className="mt-1 text-[13.5px] font-medium text-slate-600">
            Track your festival booking, Sivakasi warehouse packing status, and live transporter dispatch.
          </p>
        </div>

        {userMobile ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 p-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-800">Logged In</p>
              <p className="text-[13px] font-black text-slate-900">+91 {userMobile}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="btn-gold flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase shadow-sm"
          >
            <User size={14} /> Customer Login
          </button>
        )}
      </div>

      {/* SECTION 1: LOGGED IN CUSTOMER ORDERS */}
      {userMobile ? (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Package size={18} className="text-red-600" />
              <span>Orders Placed with +91 {userMobile} ({customerOrders.length})</span>
            </h2>
            <button
              onClick={() => userMobile && loadCustomerOrders(userMobile)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 transition"
              title="Refresh order status"
            >
              <RefreshCw size={13} className={loadingOrders ? "animate-spin text-red-600" : ""} />
              <span>Live Updates</span>
            </button>
          </div>

          {loadingOrders && customerOrders.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
              <p className="mt-3 text-xs font-bold text-slate-600">Retrieving your order records from server...</p>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package size={28} />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-800">No orders placed yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                No booking records found for +91 {userMobile}. Add items to your cart and place your festive order!
              </p>
              <Link href="/products" className="btn-gold mt-5 inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase">
                Explore Fireworks Catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {customerOrders.map((o) => {
                const stageIdx = getStageIndex(o.status);
                const isDelivered = o.status === "DELIVERED";
                return (
                  <div
                    key={o.estimateNumber}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {/* Order Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-base font-black text-red-600">
                          {o.estimateNumber}
                        </span>
                        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {o.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                            <BadgeCheck size={12} /> PAID ({o.paymentMethod || "UPI"})
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800">
                            Payment: {o.paymentMethod || "COD"} (Pending)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-slate-900">
                          {formatINR(Number(o.grandTotal || o.subtotal || 0))}
                        </span>
                        <Link
                          href={`/estimate/${o.estimateNumber}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-red-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-red-700 transition shadow-xs"
                        >
                          <Receipt size={13} /> View Invoice
                        </Link>
                      </div>
                    </div>

                    {/* Live Progress Stage Tracker */}
                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Stage</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-black text-red-700">
                          <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                          {o.status || "NEW"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {STAGES.map((st, sIdx) => {
                          const isDone = sIdx <= stageIdx;
                          const isCurrent = sIdx === stageIdx;
                          return (
                            <div
                              key={st.key}
                              className={`rounded-2xl border p-3 text-center transition ${
                                isCurrent
                                  ? "border-red-500 bg-red-50/60 ring-2 ring-red-400"
                                  : isDone
                                    ? "border-emerald-300 bg-emerald-50/50"
                                    : "border-slate-200 bg-slate-50/40 opacity-50"
                              }`}
                            >
                              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">
                                {isDone ? (
                                  <CheckCircle2 size={18} className="text-emerald-600" />
                                ) : (
                                  <span className="h-5 w-5 rounded-full border-2 border-slate-300 text-slate-400 text-[10px] flex items-center justify-center">
                                    {sIdx + 1}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-[11.5px] font-black text-slate-900">{st.label}</p>
                              <p className="text-[9.5px] text-slate-500 font-medium">{st.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Items & Delivery Info */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 font-medium">
                        <div>
                          <span>📦 Items: <strong>{o.itemCount || (o.items ? o.items.length : 0)} Products</strong></span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>📍 Deliver To: <strong>{o.city || o.state || "Tamil Nadu"}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={waLink(`Hi Mayilon, I am tracking my order ${o.estimateNumber}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                          >
                            <MessageCircle size={14} /> WhatsApp Support
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* SECTION 2: SEARCH SINGLE ESTIMATE BY REFERENCE NUMBER */}
      <div className="mt-12 glass rounded-[32px] border border-red-500/20 bg-white p-8 sm:p-10 shadow-lg">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900">
            Track by Reference Number
          </h2>
          <p className="mt-1.5 text-xs text-slate-600 font-medium">
            Have a quote or estimate number (e.g. <strong>MYL-2608-XXXXXX</strong>)? Enter it below to look up the exact live status and invoice.
          </p>
        </div>

        <form onSubmit={lookup} className="mt-6 max-w-md mx-auto">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" />
            <input
              className="field pl-11 uppercase tracking-[2px] !bg-slate-50 !border-red-500/25 !text-slate-900 font-black placeholder:!text-slate-400 focus:!border-red-600"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="MYL-2608-123456"
            />
          </div>
          {error && <p className="mt-3 text-xs font-bold text-red-600 text-center">{error}</p>}
          <button
            disabled={busy}
            className="btn-gold mt-4 w-full py-3 text-xs uppercase font-extrabold tracking-wider disabled:opacity-50"
          >
            {busy ? "Searching Records…" : "Track Estimate Status"}
          </button>
        </form>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        userMobile={userMobile}
        onLoginSuccess={(m) => {
          setUserMobile(m);
          localStorage.setItem("mayilon_user_mobile", m);
        }}
        onLogout={() => {
          setUserMobile(null);
          localStorage.removeItem("mayilon_user_mobile");
          setCustomerOrders([]);
        }}
      />
    </div>
  );
}
