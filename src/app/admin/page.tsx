"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock,
  Edit,
  Handshake,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Plus,
  QrCode,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { LogoLockup } from "@/components/brand/Logo";
import { formatINR } from "@/lib/estimate";

type Stats = {
  kpis: {
    pipeline: number;
    estimateCount: number;
    avgValue: number;
    todayCount: number;
    todayValue: number;
    pending: number;
    conversionRate: number;
    products: number;
    dealers: number;
    enquiries: number;
    subscribers: number;
  };
  byStatus: { status: string; count: number; value: number }[];
  topProducts: { name: string; sku: string; units: number; value: number }[];
  lowStock: { name: string; sku: string; stock: number }[];
  recentEstimates: EstimateRow[];
  activity: { id: string; actor: string; action: string; entity: string; createdAt: string }[];
};

type EstimateRow = {
  id: string;
  estimateNumber: string;
  customerName: string;
  mobile: string;
  state: string;
  district?: string;
  city?: string;
  address?: string;
  itemCount: number;
  grandTotal: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  adminNote?: string | null;
};

type ProductItem = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  mrp: number;
  offerPrice: number;
  packing: string;
  moq: number;
  stock: number;
  imageUrl?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
};

const STATUSES = ["NEW", "PENDING", "PACKAGE READY", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED", "REJECTED"];
const TABS = [
  { k: "dashboard", l: "Dashboard", icon: LayoutDashboard },
  { k: "estimates", l: "Orders & Estimates", icon: Receipt },
  { k: "inventory", l: "Products & Offers", icon: Boxes },
  { k: "dealers", l: "Dealers", icon: Handshake },
  { k: "enquiries", l: "Enquiries", icon: Mail },
  { k: "analytics", l: "Analytics", icon: BarChart3 },
] as const;

type TabKey = (typeof TABS)[number]["k"];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [dealers, setDealers] = useState<Record<string, string>[]>([]);
  const [enquiries, setEnquiries] = useState<Record<string, string>[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    categoryName: "PREMIUM FOUNTAINS",
    mrp: 500,
    offerPrice: 100,
    packing: "1 BOX (10 PCS)",
    moq: 1,
    stock: 250,
    imageUrl: "",
    isNewArrival: false,
    isBestSeller: true,
    isPremium: false,
  });

  // Notification Toast State
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<EstimateRow | null>(null);

  const load = useCallback(async () => {
    const [s, e, d, q, p] = await Promise.all([
      fetch("/api/v1/admin/stats").then((r) => r.json()),
      fetch("/api/v1/estimates").then((r) => r.json()),
      fetch("/api/v1/dealers").then((r) => r.json()),
      fetch("/api/v1/enquiries").then((r) => r.json()),
      fetch("/api/v1/products?limit=60&sort=alpha").then((r) => r.json()),
    ]);
    if (s.success) setStats(s.data);
    if (e.success) setEstimates(e.data.items);
    if (d.success) setDealers(d.data.items);
    if (q.success) setEnquiries(q.data.items);
    if (p.success) {
      setProducts(
        p.data.items.map((it: Record<string, unknown>) => ({
          id: String(it.id),
          sku: String(it.sku),
          name: String(it.name),
          categoryName: String(it.categoryName),
          mrp: Number(it.mrp),
          offerPrice: Number(it.offerPrice),
          packing: String(it.packing),
          moq: Number(it.moq || 1),
          stock: Number(it.stock || 100),
          imageUrl: String(it.imageUrl || ""),
          isNewArrival: Boolean(it.isNewArrival),
          isBestSeller: Boolean(it.isBestSeller),
          isPremium: Boolean(it.isPremium),
        })),
      );
    }
  }, []);

  useEffect(() => {
    fetch("/api/v1/admin/session")
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j?.data?.authenticated)));
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanPasscode = passcode.trim();
    if (cleanPasscode === "mayilon-admin") {
      setAuthed(true);
      void fetch("/api/v1/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: cleanPasscode }),
      });
      return;
    }
    const res = await fetch("/api/v1/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: cleanPasscode }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.message);
      return;
    }
    setAuthed(true);
  }

  async function updateStatus(number: string, status: string, customerMobile?: string) {
    setEstimates((prev) =>
      prev.map((e) => (e.estimateNumber === number ? { ...e, status } : e)),
    );
    await fetch(`/api/v1/estimates/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    // Notify Customer simulation
    const msg = `📲 Notification sent to +91 ${customerMobile || "Customer"}: Order ${number} status updated to [${status}]! 📦✨`;
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 5000);

    void load();
  }

  function handleMarkPaid(estimateNumber: string, method: string) {
    setEstimates((prev) =>
      prev.map((e) =>
        e.estimateNumber === estimateNumber
          ? { ...e, paymentStatus: "PAID", paymentMethod: method }
          : e,
      ),
    );
    setPaymentModalOrder(null);
    setNotificationToast(`✅ Payment confirmed via ${method} for Order ${estimateNumber}! Order moved to Processing.`);
    setTimeout(() => setNotificationToast(null), 5000);
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, ...productForm, discountPercent: Math.round(((productForm.mrp - productForm.offerPrice) / productForm.mrp) * 100) }
            : p,
        ),
      );
      setNotificationToast(`✏️ Product "${productForm.name}" updated successfully!`);
    } else {
      const newP: ProductItem = {
        id: `prod-${Date.now()}`,
        ...productForm,
      };
      setProducts((prev) => [newP, ...prev]);
      setNotificationToast(`🎉 New Product "${productForm.name}" added to catalogue!`);
    }
    setTimeout(() => setNotificationToast(null), 4000);
    setProductModalOpen(false);
    setEditingProduct(null);
  }

  function openEditProduct(p: ProductItem) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      categoryName: p.categoryName,
      mrp: p.mrp,
      offerPrice: p.offerPrice,
      packing: p.packing,
      moq: p.moq,
      stock: p.stock,
      imageUrl: p.imageUrl || "",
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isPremium: Boolean(p.isPremium),
    });
    setProductModalOpen(true);
  }

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm({
      name: "",
      sku: `MYL-NEW-${Math.floor(10 + Math.random() * 90)}`,
      categoryName: "PREMIUM FOUNTAINS",
      mrp: 500,
      offerPrice: 100,
      packing: "1 BOX (10 PCS)",
      moq: 1,
      stock: 250,
      imageUrl: "",
      isNewArrival: true,
      isBestSeller: false,
      isPremium: false,
    });
    setProductModalOpen(true);
  }

  if (authed === null) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 font-bold">
        Loading Mayilon Admin Console…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass w-full max-w-md rounded-[32px] border border-red-500/20 bg-white p-10 shadow-2xl"
        >
          <LogoLockup size={48} />
          <h1 className="mt-7 font-display text-2xl font-bold text-slate-900">Mayilon Admin Portal</h1>
          <p className="mt-2 text-[13.5px] font-medium text-slate-600">
            Secure admin access for order management, stock updates & payment verification.
          </p>
          <label className="mt-7 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">
            Admin Passcode
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="field mt-2 !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
            placeholder="Enter admin passcode"
          />
          {error && <p className="mt-3 text-[12.5px] font-bold text-red-600">{error}</p>}
          <button type="submit" className="btn-gold mt-6 w-full py-3.5 text-sm uppercase font-bold">
            Sign In to Dashboard
          </button>
          <p className="mt-5 text-[11.5px] font-medium text-slate-500">
            Passcode: <span className="font-bold text-red-600">mayilon-admin</span>
          </p>
          <Link href="/" className="mt-5 block text-center text-[12px] font-bold text-slate-500 hover:text-red-600">
            ← Back to Storefront
          </Link>
        </motion.form>
      </div>
    );
  }

  const k = stats?.kpis;
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-5 left-1/2 z-[1000] -translate-x-1/2 rounded-2xl border border-red-500/30 bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-2xl flex items-center gap-3"
          >
            <Send size={18} className="text-amber-400" />
            {notificationToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="glass-dark sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-red-500/15 bg-white p-6 shadow-md lg:flex">
        <LogoLockup size={40} />
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">
          ADMIN CONSOLE v2.0
        </div>

        <nav className="mt-8 flex-1 space-y-2">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[13.5px] font-bold transition-all duration-300 ${
                tab === t.k
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <t.icon size={18} /> {t.l}
            </button>
          ))}
        </nav>

        <Link href="/" className="mb-3 text-[12.5px] font-bold text-slate-500 hover:text-red-600">
          ← View Storefront
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/v1/admin/session", { method: "DELETE" });
            setAuthed(false);
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12.5px] font-bold text-slate-700 hover:border-red-500 hover:text-red-600"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 p-6 sm:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-bold capitalize text-slate-900">{tab}</h1>
            <p className="text-[13px] font-medium text-slate-500">
              Mayilon Crackers Operations · Live Inventory, Orders & Payment Processing
            </p>
          </div>
          <div className="glass flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-700 shadow-sm">
            <ShieldCheck size={16} /> SUPER_ADMIN Session Active
          </div>
        </header>

        {/* Mobile Navigation Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar lg:hidden">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold ${
                tab === t.k
                  ? "bg-red-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Dashboard Tab */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Kpi label="Total Pipeline" value={formatINR(k?.pipeline ?? 0, { compact: true })} sub={`${k?.estimateCount ?? 0} total orders`} icon={BarChart3} />
                  <Kpi label="Today Sales" value={`${k?.todayCount ?? 0}`} sub={formatINR(k?.todayValue ?? 0)} icon={Activity} />
                  <Kpi label="Pending Review" value={`${k?.pending ?? 0}`} sub="Awaiting packing/dispatch" icon={Receipt} accent="#EA580C" />
                  <Kpi label="Conversion Rate" value={`${(k?.conversionRate ?? 0).toFixed(1)}%`} sub={`Avg ${formatINR(k?.avgValue ?? 0)}`} icon={CheckCircle2} accent="#16A34A" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Mini label="Products Live" value={products.length || (k?.products ?? 0)} />
                  <Mini label="Dealer Applications" value={k?.dealers ?? 0} />
                  <Mini label="Enquiries" value={k?.enquiries ?? 0} />
                  <Mini label="Subscribers" value={k?.subscribers ?? 0} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="Pipeline Status Breakdown">
                    {(stats?.byStatus ?? []).length === 0 && <Empty>No estimates recorded yet.</Empty>}
                    <div className="space-y-3">
                      {(stats?.byStatus ?? []).map((s) => {
                        const max = Math.max(...(stats?.byStatus ?? []).map((x) => x.count), 1);
                        return (
                          <div key={s.status}>
                            <div className="mb-1 flex justify-between text-[13px] font-bold">
                              <span className="text-slate-700">{s.status}</span>
                              <span className="text-red-600">
                                {s.count} orders · {formatINR(s.value, { compact: true })}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(s.count / max) * 100}%` }}
                                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel title="Low Stock Alerts">
                    <div className="space-y-2.5">
                      {(stats?.lowStock ?? []).map((p) => (
                        <div key={p.sku} className="flex items-center justify-between text-[13px] font-bold">
                          <span className="truncate pr-4 text-slate-700">{p.name}</span>
                          <span className={p.stock < 200 ? "text-red-600" : "text-slate-500"}>
                            {p.stock} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {/* Orders & Estimates Tab */}
            {tab === "estimates" && (
              <Panel title={`Orders & Estimates (${estimates.length})`}>
                {estimates.length === 0 && (
                  <Empty>No orders submitted yet. Build an estimate from the storefront to see live orders here.</Empty>
                )}
                <div className="overflow-x-auto">
                  {estimates.length > 0 && (
                    <table className="w-full min-w-[920px] text-[13.5px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-[2px] text-slate-500">
                          <th className="py-3">Reference</th>
                          <th className="py-3">Customer</th>
                          <th className="py-3">Location</th>
                          <th className="py-3 text-center">Items</th>
                          <th className="py-3 text-right">Value</th>
                          <th className="py-3">Payment</th>
                          <th className="py-3">Workflow Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.map((e) => (
                          <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3.5 font-bold">
                              <Link href={`/estimate/${e.estimateNumber}`} className="text-red-600 hover:underline">
                                {e.estimateNumber}
                              </Link>
                              <p className="text-[11px] font-medium text-slate-400">
                                {new Date(e.createdAt).toLocaleDateString("en-IN")}
                              </p>
                            </td>
                            <td className="py-3.5">
                              <p className="font-bold text-slate-900">{e.customerName}</p>
                              <p className="text-[11.5px] font-medium text-slate-500">{e.mobile}</p>
                            </td>
                            <td className="py-3.5 text-slate-700 font-medium">
                              {e.city ? `${e.city}, ` : ""}{e.state}
                            </td>
                            <td className="py-3.5 text-center font-bold text-slate-700">{e.itemCount}</td>
                            <td className="py-3.5 text-right font-bold text-red-600">
                              {formatINR(Number(e.grandTotal))}
                            </td>
                            <td className="py-3.5">
                              {e.paymentStatus === "PAID" ? (
                                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                  ✓ PAID ({e.paymentMethod || "UPI"})
                                </span>
                              ) : (
                                <button
                                  onClick={() => setPaymentModalOrder(e)}
                                  className="rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                                >
                                  💳 Pay Now / Confirm
                                </button>
                              )}
                            </td>
                            <td className="py-3.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* PACKAGE READY QUICK BUTTON */}
                                {e.status !== "PACKAGE READY" && e.status !== "SHIPPED" && e.status !== "DELIVERED" && (
                                  <button
                                    onClick={() => updateStatus(e.estimateNumber, "PACKAGE READY", e.mobile)}
                                    className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-red-700"
                                  >
                                    <Package size={13} /> Package Ready
                                  </button>
                                )}
                                {e.status === "PACKAGE READY" && (
                                  <button
                                    onClick={() => updateStatus(e.estimateNumber, "SHIPPED", e.mobile)}
                                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700"
                                  >
                                    <Truck size={13} /> Mark Shipped
                                  </button>
                                )}
                                <select
                                  value={e.status}
                                  onChange={(ev) => updateStatus(e.estimateNumber, ev.target.value, e.mobile)}
                                  className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-bold text-slate-800 outline-none focus:border-red-600"
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Panel>
            )}

            {/* Inventory Tab */}
            {tab === "inventory" && (
              <Panel
                title={
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span>Product Catalogue ({filteredProducts.length})</span>
                    <button
                      onClick={openAddProduct}
                      className="btn-gold flex items-center gap-2 px-5 py-2.5 text-[12.5px] uppercase font-bold"
                    >
                      <Plus size={16} /> Upload New Product
                    </button>
                  </div>
                }
              >
                <div className="mb-4 relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by product name, SKU or category…"
                    className="field pl-11 !bg-slate-50 !border-slate-200 !text-slate-900 font-bold"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-[13.5px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-[2px] text-slate-500">
                        <th className="py-3">SKU</th>
                        <th className="py-3">Product Name</th>
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">MRP</th>
                        <th className="py-3 text-right">Offer Price</th>
                        <th className="py-3 text-right">Stock</th>
                        <th className="py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={String(p.id)} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-500">{p.sku}</td>
                          <td className="py-3 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 font-medium text-slate-600">{p.categoryName}</td>
                          <td className="py-3 text-right text-slate-400 line-through">
                            {formatINR(Number(p.mrp))}
                          </td>
                          <td className="py-3 text-right font-bold text-red-600">
                            {formatINR(Number(p.offerPrice))}
                          </td>
                          <td
                            className={`py-3 text-right font-bold ${
                              Number(p.stock) < 200 ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {p.stock}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11.5px] font-bold text-slate-700 hover:border-red-500 hover:text-red-600 shadow-sm"
                            >
                              <Edit size={13} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {/* Dealers Tab */}
            {tab === "dealers" && (
              <Panel title={`Dealer Applications (${dealers.length})`}>
                {dealers.length === 0 && <Empty>No dealer applications yet.</Empty>}
                <div className="space-y-3">
                  {dealers.map((d) => (
                    <div key={String(d.id)} className="rounded-2xl border border-red-500/15 bg-white p-5 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">{d.businessName}</p>
                          <p className="text-[12.5px] font-medium text-slate-600">
                            {d.contactName} · {d.mobile} · {d.city}, {d.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700">
                            {d.tier}
                          </span>
                          <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold text-red-600">
                            {d.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Enquiries Tab */}
            {tab === "enquiries" && (
              <Panel title={`Customer Enquiries (${enquiries.length})`}>
                {enquiries.length === 0 && <Empty>No enquiries received yet.</Empty>}
                <div className="space-y-3">
                  {enquiries.map((e) => (
                    <div key={String(e.id)} className="rounded-2xl border border-red-500/15 bg-white p-5 shadow-md">
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-bold text-slate-900">{e.name}</p>
                        <span className="text-[12px] font-bold text-slate-500">{e.mobile}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-bold uppercase tracking-[2px] text-red-600">{e.subject}</p>
                      <p className="mt-2 text-[13.5px] font-medium text-slate-700">{e.message}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Revenue Funnel">
                  <div className="space-y-4">
                    {[
                      { l: "Estimates Received", v: k?.estimateCount ?? 0 },
                      { l: "Package Ready", v: stats?.byStatus.find((s) => s.status === "PACKAGE READY")?.count ?? 0 },
                      { l: "Shipped", v: stats?.byStatus.find((s) => s.status === "SHIPPED")?.count ?? 0 },
                      { l: "Delivered", v: stats?.byStatus.find((s) => s.status === "DELIVERED")?.count ?? 0 },
                    ].map((s, i) => (
                      <div key={s.l}>
                        <div className="mb-1 flex justify-between text-[13px] font-bold">
                          <span className="text-slate-700">{s.l}</span>
                          <span className="text-red-600">{s.v}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(6, 100 - i * 22)}%` }}
                            transition={{ duration: 0.9, delay: i * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Product Upload / Edit Modal */}
      <AnimatePresence>
        {productModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProductModalOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-8 shadow-2xl"
            >
              <button
                onClick={() => setProductModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <h2 className="font-display text-2xl font-bold text-slate-900">
                {editingProduct ? "Edit Product & Price" : "Upload New Product"}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Configure details, MRP, factory offer price, packing, and collection flags.
              </p>

              <form onSubmit={handleSaveProduct} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Product Name *</span>
                  <input
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    placeholder="e.g. 10 Shot Sky Thunder"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">SKU Code *</span>
                    <input
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Category *</span>
                    <select
                      value={productForm.categoryName}
                      onChange={(e) => setProductForm({ ...productForm, categoryName: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    >
                      {["ONE SOUND CRACKERS", "FLOWER POTS", "PREMIUM FOUNTAINS", "GROUND CHAKKARS", "ROCKETS", "SKY SHOTS", "SPARKLERS", "GIFT BOXES"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">MRP (₹) *</span>
                    <input
                      type="number"
                      required
                      value={productForm.mrp}
                      onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Offer Price (₹) *</span>
                    <input
                      type="number"
                      required
                      value={productForm.offerPrice}
                      onChange={(e) => setProductForm({ ...productForm, offerPrice: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Packing</span>
                    <input
                      value={productForm.packing}
                      onChange={(e) => setProductForm({ ...productForm, packing: e.target.value })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">MOQ</span>
                    <input
                      type="number"
                      value={productForm.moq}
                      onChange={(e) => setProductForm({ ...productForm, moq: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Stock</span>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="field mt-1.5 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold"
                    />
                  </label>
                </div>

                {/* Direct Image Upload */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-slate-700 block mb-1.5">
                    Product Image (Direct File Upload / Supabase Storage)
                  </span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/v1/admin/upload", { method: "POST", body: fd });
                        const json = await res.json();
                        if (json.success) {
                          setProductForm((prev) => ({ ...prev, imageUrl: json.data.url }));
                          setNotificationToast("📸 Product image uploaded & stored successfully!");
                          setTimeout(() => setNotificationToast(null), 3000);
                        }
                      }}
                      className="field !bg-slate-50 !border-slate-300 !text-slate-900 font-bold file:mr-3 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white cursor-pointer"
                    />
                    {productForm.imageUrl && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={productForm.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder="Or paste direct image URL..."
                    className="field mt-2 !bg-slate-50 !border-slate-300 !text-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isNewArrival}
                      onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                      className="accent-red-600"
                    />
                    New Arrival
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                      className="accent-red-600"
                    />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isPremium}
                      onChange={(e) => setProductForm({ ...productForm, isPremium: e.target.checked })}
                      className="accent-red-600"
                    />
                    Premium Collection
                  </label>
                </div>

                <button type="submit" className="btn-gold mt-6 w-full py-3.5 text-sm uppercase font-bold">
                  {editingProduct ? "Save Product Changes" : "Create & Publish Product"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {paymentModalOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaymentModalOrder(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-red-500/20 bg-white p-8 shadow-2xl text-center"
            >
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-600 hover:text-white"
              >
                <X size={16} />
              </button>

              <QrCode size={36} className="mx-auto text-red-600" />
              <h2 className="mt-3 font-display text-xl font-bold text-slate-900">Payment Gateway</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Confirm payment for Order <span className="font-bold text-red-600">{paymentModalOrder.estimateNumber}</span> ({formatINR(Number(paymentModalOrder.grandTotal))})
              </p>

              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-50 p-4 text-center">
                {/* SVG QR Code Simulation */}
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl bg-white border border-slate-200 p-2 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=mayilon@upi&pn=Mayilon%20Crackers&am=${paymentModalOrder.grandTotal}`}
                    alt="All UPI QR Code"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-700">Scan via GPay, PhonePe, Paytm or BHIM</p>
                <p className="text-[10px] text-slate-500">UPI ID: mayiloncrackers@sbi</p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "Dynamic All-UPI QR")}
                  className="btn-gold w-full py-3 text-xs uppercase font-bold"
                >
                  ✓ Confirm Payment via UPI QR
                </button>
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "Razorpay Gateway")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-900 py-3 text-xs font-bold uppercase text-white hover:bg-slate-800"
                >
                  Confirm via Razorpay
                </button>
                <button
                  onClick={() => handleMarkPaid(paymentModalOrder.estimateNumber, "PayU Gateway")}
                  className="w-full rounded-2xl border border-slate-200 bg-blue-600 py-3 text-xs font-bold uppercase text-white hover:bg-blue-700"
                >
                  Confirm via PayU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = "#DC2626",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent?: string;
}) {
  return (
    <div className="glass rounded-[24px] border border-red-500/15 bg-white p-6 shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-slate-500">{label}</p>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="mt-3 font-display text-[27px] font-bold text-slate-900">{value}</p>
      <p className="text-[12px] font-medium text-slate-500">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-[20px] border border-red-500/15 bg-white p-5 shadow-sm">
      <p className="text-[10.5px] font-bold uppercase tracking-[2px] text-slate-500">{label}</p>
      <p className="mt-1.5 font-display text-[21px] font-bold text-red-600">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[26px] border border-red-500/15 bg-white p-6 shadow-md">
      {typeof title === "string" ? (
        <h3 className="mb-5 font-display text-[16px] font-bold text-slate-900">{title}</h3>
      ) : (
        <div className="mb-5">{title}</div>
      )}
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[13px] font-medium text-slate-400">{children}</p>;
}
