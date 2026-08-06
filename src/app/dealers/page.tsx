"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Crown, Handshake, Truck, Wallet } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { STATES } from "@/lib/estimate";

const TIERS = [
  { name: "Retail", margin: "Standard price list", credit: "Prepaid", moq: "₹3,000", perks: ["Full catalogue access", "Festival coupons", "Estimate PDF"] },
  { name: "Wholesale", margin: "8% below list", credit: "7-day credit", moq: "₹50,000", perks: ["Priority packing slot", "Free transport", "Dedicated executive"] },
  { name: "Distributor", margin: "14% below list", credit: "21-day credit", moq: "₹2,50,000", perks: ["Territory allocation", "Bulk Excel ordering", "Co-branded catalogue"] },
  { name: "Super Dealer", margin: "20% below list", credit: "45-day credit + wallet", moq: "₹10,00,000", perks: ["Season stock reservation", "Custom pack manufacturing", "Quarterly rebate"] },
];

export default function DealersPage() {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    mobile: "",
    email: "",
    gstNumber: "",
    licenseNumber: "",
    state: "Tamil Nadu",
    city: "",
    expectedVolume: "₹50,000 – ₹2,00,000",
    tier: "WHOLESALE",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/v1/dealers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setBusy(false);
    setMsg({ ok: json.success, text: json.message });
  }

  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">Wholesale & Dealers</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[4px] text-red-600">
          <Handshake size={14} /> B2B Programme
        </span>
        <h1 className="mt-4 font-display text-[36px] font-bold leading-tight text-slate-900 sm:text-[48px]">
          Sell Mayilon in your <span className="gold-text">Territory</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600 font-medium">
          Four dealer tiers, credit terms, wallet balance, bulk Excel ordering and season stock
          reservation — backed by a factory that ships from Sivakasi within 48 hours.
        </p>
      </header>

      <section className="py-12">
        <div className="grid gap-6 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div
                className={`glass lift-card h-full rounded-[30px] p-7 border border-red-500/15 bg-white shadow-md ${
                  i === 3 ? "border-red-500 shadow-xl" : ""
                }`}
              >
                {i === 3 && (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    <Crown size={11} /> Best Margin
                  </span>
                )}
                <h3 className="font-display text-[20px] font-bold text-slate-900">{t.name}</h3>
                <p className="mt-2 font-display text-[24px] font-bold text-red-600">{t.margin}</p>
                <div className="mt-5 space-y-2 border-t border-slate-200 pt-5 text-[12.5px] font-medium text-slate-600">
                  <p className="flex items-center gap-2"><Wallet size={14} className="text-red-600" /> {t.credit}</p>
                  <p className="flex items-center gap-2"><Truck size={14} className="text-red-600" /> MOQ {t.moq}</p>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2 text-[13px] font-medium text-slate-700">
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-10">
        <SectionHeading
          eyebrow="Apply Now"
          title={
            <>
              Dealer <span className="gold-text">Registration</span>
            </>
          }
          sub="Submit your GST and explosives licence details. Our compliance team verifies within 24 hours and activates your tier pricing."
        />

        <Reveal>
          <form onSubmit={submit} className="glass mx-auto max-w-3xl rounded-[30px] p-8 border border-red-500/20 bg-white shadow-xl">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { k: "businessName", l: "Business / Firm Name *", req: true },
                { k: "contactName", l: "Contact Person *", req: true },
                { k: "mobile", l: "Mobile *", req: true, numeric: true },
                { k: "email", l: "Email" },
                { k: "gstNumber", l: "GST Number" },
                { k: "licenseNumber", l: "Explosives Licence No." },
                { k: "city", l: "City / Town" },
              ].map((f) => (
                <label key={f.k} className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">{f.l}</span>
                  <input
                    required={f.req}
                    className="field !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
                    value={form[f.k as keyof typeof form]}
                    inputMode={f.numeric ? "numeric" : undefined}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [f.k]: f.numeric ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value,
                      })
                    }
                  />
                </label>
              ))}

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">State *</span>
                <select className="field cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {STATES.map((s) => <option key={s} className="bg-white text-slate-900">{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Requested Tier</span>
                <select className="field cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                  {["WHOLESALE", "DISTRIBUTOR", "SUPER_DEALER"].map((s) => <option key={s} className="bg-white text-slate-900">{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[2px] text-slate-700">Expected Season Volume</span>
                <select className="field cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600" value={form.expectedVolume} onChange={(e) => setForm({ ...form, expectedVolume: e.target.value })}>
                  {["₹50,000 – ₹2,00,000", "₹2,00,000 – ₹10,00,000", "₹10,00,000 – ₹50,00,000", "₹50,00,000+"].map((s) => (
                    <option key={s} className="bg-white text-slate-900">{s}</option>
                  ))}
                </select>
              </label>
            </div>

            {msg && (
              <p className={`mt-6 rounded-xl border p-3 text-[13px] font-bold ${msg.ok ? "border-emerald-500/40 bg-emerald-50 text-emerald-700" : "border-red-500/40 bg-red-50 text-red-700"}`}>
                {msg.text}
              </p>
            )}

            <button disabled={busy} className="btn-gold mt-7 w-full py-3.5 text-sm uppercase font-bold disabled:opacity-50">
              {busy ? "Submitting…" : "Submit Dealer Application"}
            </button>
            <p className="mt-4 text-center text-[12px] text-slate-500 font-medium">
              By applying you confirm you hold a valid licence to store and sell fireworks in your
              state.
            </p>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
