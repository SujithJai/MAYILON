"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Boxes,
  Handshake,
  LayoutDashboard,
  LogOut,
  Mail,
  Receipt,
  ShieldCheck,
  TrendingUp,
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
  itemCount: number;
  grandTotal: string;
  status: string;
  createdAt: string;
  adminNote?: string | null;
};

const STATUSES = ["NEW", "PENDING", "APPROVED", "REJECTED", "CONVERTED", "PACKING", "DISPATCHED", "DELIVERED"];
const TABS = [
  { k: "dashboard", l: "Dashboard", icon: LayoutDashboard },
  { k: "estimates", l: "Estimates", icon: Receipt },
  { k: "inventory", l: "Inventory", icon: Boxes },
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
  const [products, setProducts] = useState<Record<string, string | number>[]>([]);

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
    if (p.success) setProducts(p.data.items);
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
    const res = await fetch("/api/v1/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.message);
      return;
    }
    setAuthed(true);
  }

  async function updateStatus(number: string, status: string) {
    setEstimates((prev) => prev.map((e) => (e.estimateNumber === number ? { ...e, status } : e)));
    await fetch(`/api/v1/estimates/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void load();
  }

  if (authed === null) {
    return <div className="flex h-screen items-center justify-center text-white/40">Loading console…</div>;
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass w-full max-w-md rounded-[30px] p-9"
        >
          <LogoLockup size={44} />
          <h1 className="mt-7 font-display text-2xl font-bold text-white">Admin Console</h1>
          <p className="mt-1.5 text-[13px] text-white/45">
            Restricted area. All access attempts are logged with IP and timestamp.
          </p>
          <label className="mt-7 block text-[11px] uppercase tracking-[2px] text-white/40">
            Passcode
          </label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="field mt-2"
            placeholder="Enter admin passcode"
          />
          {error && <p className="mt-3 text-[12.5px] text-ember">{error}</p>}
          <button type="submit" className="btn-gold mt-6 w-full py-3 text-sm uppercase">
            Sign in
          </button>
          <p className="mt-4 text-[11.5px] text-white/30">
            Demo passcode: <span className="text-gold">mayilon-admin</span> (override with
            ADMIN_PASSCODE env var). 5 failed attempts trigger a 5-minute lockout.
          </p>
          <Link href="/" className="mt-5 block text-center text-[12px] text-white/40 hover:text-gold">
            ← Back to store
          </Link>
        </motion.form>
      </div>
    );
  }

  const k = stats?.kpis;

  return (
    <div className="flex min-h-screen">
      <aside className="glass-dark sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col p-6 lg:flex">
        <LogoLockup size={38} />
        <nav className="mt-9 flex-1 space-y-1.5">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-all duration-400 ${
                tab === t.k ? "bg-gold/15 text-gold" : "text-white/55 hover:bg-white/5"
              }`}
            >
              <t.icon size={16} /> {t.l}
            </button>
          ))}
        </nav>
        <Link href="/" className="mb-3 text-[12px] text-white/40 hover:text-gold">
          ← View storefront
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/v1/admin/session", { method: "DELETE" });
            setAuthed(false);
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-[12.5px] text-white/55 hover:border-ember/50 hover:text-ember"
        >
          <LogOut size={15} /> Sign out
        </button>
      </aside>

      <div className="min-w-0 flex-1 p-5 sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold capitalize text-white">{tab}</h1>
            <p className="text-[12.5px] text-white/40">
              Mayilon Crackers operations · live data from PostgreSQL
            </p>
          </div>
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-[11.5px] text-verde">
            <ShieldCheck size={14} /> SUPER_ADMIN session
          </div>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar lg:hidden">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12px] ${
                tab === t.k ? "bg-gold text-black" : "border border-white/12 text-white/55"
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
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Kpi label="Estimate pipeline" value={formatINR(k?.pipeline ?? 0, { compact: true })} sub={`${k?.estimateCount ?? 0} total estimates`} icon={TrendingUp} />
                  <Kpi label="Today" value={`${k?.todayCount ?? 0}`} sub={formatINR(k?.todayValue ?? 0)} icon={Activity} />
                  <Kpi label="Pending review" value={`${k?.pending ?? 0}`} sub="Awaiting sales action" icon={Receipt} accent="#FF8C00" />
                  <Kpi label="Conversion" value={`${(k?.conversionRate ?? 0).toFixed(1)}%`} sub={`Avg ${formatINR(k?.avgValue ?? 0)}`} icon={BarChart3} accent="#00D26A" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Mini label="Products live" value={k?.products ?? 0} />
                  <Mini label="Dealer applications" value={k?.dealers ?? 0} />
                  <Mini label="Enquiries" value={k?.enquiries ?? 0} />
                  <Mini label="Subscribers" value={k?.subscribers ?? 0} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="Pipeline by status">
                    {(stats?.byStatus ?? []).length === 0 && <Empty>No estimates yet.</Empty>}
                    <div className="space-y-3">
                      {(stats?.byStatus ?? []).map((s) => {
                        const max = Math.max(...(stats?.byStatus ?? []).map((x) => x.count), 1);
                        return (
                          <div key={s.status}>
                            <div className="mb-1 flex justify-between text-[12.5px]">
                              <span className="text-white/60">{s.status}</span>
                              <span className="text-gold">
                                {s.count} · {formatINR(s.value, { compact: true })}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/6">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(s.count / max) * 100}%` }}
                                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-light"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel title="Top requested products">
                    {(stats?.topProducts ?? []).length === 0 && <Empty>No estimate items yet.</Empty>}
                    <div className="space-y-2.5">
                      {(stats?.topProducts ?? []).map((p) => (
                        <div key={p.sku} className="flex items-center justify-between text-[13px]">
                          <span className="truncate pr-4 text-white/70">{p.name}</span>
                          <span className="shrink-0 text-gold">
                            {p.units} units · {formatINR(p.value, { compact: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Low stock alerts">
                    <div className="space-y-2.5">
                      {(stats?.lowStock ?? []).map((p) => (
                        <div key={p.sku} className="flex items-center justify-between text-[13px]">
                          <span className="truncate pr-4 text-white/70">{p.name}</span>
                          <span className={p.stock < 200 ? "text-flame" : "text-white/45"}>
                            {p.stock} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Recent activity (audit log)">
                    <div className="space-y-2.5">
                      {(stats?.activity ?? []).map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-[12.5px]">
                          <span className="text-white/60">
                            <span className="text-gold">{a.action}</span> · {a.entity}
                          </span>
                          <span className="text-white/30">
                            {new Date(a.createdAt).toLocaleTimeString("en-IN")}
                          </span>
                        </div>
                      ))}
                      {(stats?.activity ?? []).length === 0 && <Empty>No activity recorded.</Empty>}
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {tab === "estimates" && (
              <Panel title={`All estimates (${estimates.length})`}>
                {estimates.length === 0 && <Empty>No estimates submitted yet. Build one from the storefront to see the workflow.</Empty>}
                <div className="overflow-x-auto">
                  {estimates.length > 0 && (
                    <table className="w-full min-w-[860px] text-[13px]">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-[10.5px] uppercase tracking-[2px] text-white/35">
                          <th className="py-3">Reference</th>
                          <th className="py-3">Customer</th>
                          <th className="py-3">State</th>
                          <th className="py-3 text-center">Items</th>
                          <th className="py-3 text-right">Value</th>
                          <th className="py-3">Received</th>
                          <th className="py-3">Workflow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.map((e) => (
                          <tr key={e.id} className="border-b border-white/5">
                            <td className="py-3">
                              <Link href={`/estimate/${e.estimateNumber}`} className="text-gold hover:underline">
                                {e.estimateNumber}
                              </Link>
                            </td>
                            <td className="py-3">
                              <p className="text-white">{e.customerName}</p>
                              <p className="text-[11px] text-white/35">{e.mobile}</p>
                            </td>
                            <td className="py-3 text-white/60">{e.state}</td>
                            <td className="py-3 text-center text-white/60">{e.itemCount}</td>
                            <td className="py-3 text-right font-semibold text-gold">
                              {formatINR(Number(e.grandTotal))}
                            </td>
                            <td className="py-3 text-[12px] text-white/40">
                              {new Date(e.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3">
                              <select
                                value={e.status}
                                onChange={(ev) => updateStatus(e.estimateNumber, ev.target.value)}
                                className="rounded-lg border border-gold/25 bg-black/60 px-2.5 py-1.5 text-[12px] text-gold outline-none"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s} className="bg-black">
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Panel>
            )}

            {tab === "inventory" && (
              <Panel title={`Product catalogue (${products.length})`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-[13px]">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[10.5px] uppercase tracking-[2px] text-white/35">
                        <th className="py-3">SKU</th>
                        <th className="py-3">Product</th>
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">MRP</th>
                        <th className="py-3 text-right">Offer</th>
                        <th className="py-3 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={String(p.id)} className="border-b border-white/5">
                          <td className="py-2.5 text-white/45">{String(p.sku)}</td>
                          <td className="py-2.5 text-white">{String(p.name)}</td>
                          <td className="py-2.5 text-white/50">{String(p.categoryName)}</td>
                          <td className="py-2.5 text-right text-white/35 line-through">
                            {formatINR(Number(p.mrp))}
                          </td>
                          <td className="py-2.5 text-right text-gold">
                            {formatINR(Number(p.offerPrice))}
                          </td>
                          <td
                            className={`py-2.5 text-right ${
                              Number(p.stock) < 200 ? "text-flame" : "text-verde"
                            }`}
                          >
                            {String(p.stock)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {tab === "dealers" && (
              <Panel title={`Dealer applications (${dealers.length})`}>
                {dealers.length === 0 && <Empty>No dealer applications yet.</Empty>}
                <div className="space-y-3">
                  {dealers.map((d) => (
                    <div key={String(d.id)} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-white">{d.businessName}</p>
                          <p className="text-[12px] text-white/45">
                            {d.contactName} · {d.mobile} · {d.city}, {d.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-royal/15 px-3 py-1 text-[11px] text-royal">
                            {d.tier}
                          </span>
                          <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] text-gold">
                            {d.status}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-[12px] text-white/40">
                        GST {d.gstNumber || "—"} · Licence {d.licenseNumber || "—"} · Volume{" "}
                        {d.expectedVolume || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {tab === "enquiries" && (
              <Panel title={`Customer enquiries (${enquiries.length})`}>
                {enquiries.length === 0 && <Empty>No enquiries received yet.</Empty>}
                <div className="space-y-3">
                  {enquiries.map((e) => (
                    <div key={String(e.id)} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-medium text-white">{e.name}</p>
                        <span className="text-[11.5px] text-white/35">{e.mobile}</span>
                      </div>
                      <p className="mt-1 text-[12px] uppercase tracking-[2px] text-gold">{e.subject}</p>
                      <p className="mt-2 text-[13px] text-white/55">{e.message}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {tab === "analytics" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Revenue funnel">
                  <div className="space-y-4">
                    {[
                      { l: "Estimates received", v: k?.estimateCount ?? 0 },
                      { l: "Approved", v: stats?.byStatus.find((s) => s.status === "APPROVED")?.count ?? 0 },
                      { l: "Converted to orders", v: stats?.byStatus.find((s) => s.status === "CONVERTED")?.count ?? 0 },
                      { l: "Delivered", v: stats?.byStatus.find((s) => s.status === "DELIVERED")?.count ?? 0 },
                    ].map((s, i) => (
                      <div key={s.l}>
                        <div className="mb-1 flex justify-between text-[13px]">
                          <span className="text-white/60">{s.l}</span>
                          <span className="text-gold">{s.v}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white/6">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.max(4, 100 - i * 22)}%`,
                            }}
                            transition={{ duration: 0.9, delay: i * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-royal via-gold to-flame"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Operational KPIs">
                  <div className="grid grid-cols-2 gap-4">
                    <Mini label="Avg estimate value" value={formatINR(k?.avgValue ?? 0)} />
                    <Mini label="Conversion rate" value={`${(k?.conversionRate ?? 0).toFixed(1)}%`} />
                    <Mini label="Pipeline value" value={formatINR(k?.pipeline ?? 0, { compact: true })} />
                    <Mini label="Catalogue size" value={k?.products ?? 0} />
                  </div>
                  <p className="mt-5 text-[12px] leading-relaxed text-white/40">
                    Connect GA4, Search Console and Meta Pixel via Settings to layer traffic,
                    keyword and campaign attribution on top of this first-party pipeline data.
                  </p>
                </Panel>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = "#D4AF37",
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accent?: string;
}) {
  return (
    <div className="glass rounded-[24px] p-6">
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-[2.5px] text-white/40">{label}</p>
        <Icon size={17} style={{ color: accent }} />
      </div>
      <p className="mt-3 font-display text-[27px] font-bold text-white">{value}</p>
      <p className="text-[12px] text-white/40">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-[20px] p-5">
      <p className="text-[10.5px] uppercase tracking-[2px] text-white/35">{label}</p>
      <p className="mt-1.5 font-display text-[21px] font-bold text-gold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[26px] p-6">
      <h3 className="mb-5 font-display text-[15px] font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[13px] text-white/35">{children}</p>;
}
