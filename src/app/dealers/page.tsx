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
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">Wholesale & Dealers</span>
      </nav>

      <header className="mt-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[4px] text-gold">
          <Handshake size={14} /> B2B Programme
        </span>
        <h1 className="mt-5 font-display text-[36px] font-bold leading-tight sm:text-[48px]">
          Sell Mayilon in your <span className="gold-text">territory</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/55">
          Four dealer tiers, credit terms, wallet balance, bulk Excel ordering and season stock
          reservation — backed by a factory that ships from Sivakasi within 48 hours.
        </p>
      </header>

      <section className="py-14">
        <div className="grid gap-6 lg:grid-cols-4">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <div
                className={`glass lift-card h-full rounded-[30px] p-7 ${
                  i === 3 ? "border-gold/60 shadow-[0_0_60px_-30px_rgba(212,175,55,0.9)]" : ""
                }`}
              >
                {i === 3 && (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                    <Crown size={11} /> Best margin
                  </span>
                )}
                <h3 className="font-display text-[20px] font-bold text-white">{t.name}</h3>
                <p className="mt-2 font-display text-[24px] font-bold text-gold">{t.margin}</p>
                <div className="mt-5 space-y-2 border-t border-white/8 pt-5 text-[12.5px] text-white/55">
                  <p className="flex items-center gap-2"><Wallet size={13} className="text-gold" /> {t.credit}</p>
                  <p className="flex items-center gap-2"><Truck size={13} className="text-gold" /> MOQ {t.moq}</p>
                </div>
                <ul className="mt-5 space-y-2">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2 text-[12.5px] text-white/60">
                      <BadgeCheck size={14} className="mt-0.5 shrink-0 text-verde" /> {p}
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
          eyebrow="Apply now"
          title={
            <>
              Dealer <span className="gold-text">registration</span>
            </>
          }
          sub="Submit your GST and explosives licence details. Our compliance team verifies within 24 hours and activates your tier pricing."
        />

        <Reveal>
          <form onSubmit={submit} className="glass mx-auto max-w-3xl rounded-[30px] p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { k: "businessName", l: "Business / firm name *", req: true },
                { k: "contactName", l: "Contact person *", req: true },
                { k: "mobile", l: "Mobile *", req: true, numeric: true },
                { k: "email", l: "Email" },
                { k: "gstNumber", l: "GST number" },
                { k: "licenseNumber", l: "Explosives licence no." },
                { k: "city", l: "City / town" },
              ].map((f) => (
                <label key={f.k} className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">{f.l}</span>
                  <input
                    required={f.req}
                    className="field"
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
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">State *</span>
                <select className="field cursor-pointer bg-black/60" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {STATES.map((s) => <option key={s} className="bg-black">{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Requested tier</span>
                <select className="field cursor-pointer bg-black/60" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                  {["WHOLESALE", "DISTRIBUTOR", "SUPER_DEALER"].map((s) => <option key={s} className="bg-black">{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Expected season volume</span>
                <select className="field cursor-pointer bg-black/60" value={form.expectedVolume} onChange={(e) => setForm({ ...form, expectedVolume: e.target.value })}>
                  {["₹50,000 – ₹2,00,000", "₹2,00,000 – ₹10,00,000", "₹10,00,000 – ₹50,00,000", "₹50,00,000+"].map((s) => (
                    <option key={s} className="bg-black">{s}</option>
                  ))}
                </select>
              </label>
            </div>

            {msg && (
              <p className={`mt-6 rounded-xl border p-3 text-[13px] ${msg.ok ? "border-verde/40 bg-verde/8 text-verde" : "border-ember/40 bg-ember/10 text-ember"}`}>
                {msg.text}
              </p>
            )}

            <button disabled={busy} className="btn-gold mt-7 w-full py-3.5 text-sm uppercase disabled:opacity-50">
              {busy ? "Submitting…" : "Submit dealer application"}
            </button>
            <p className="mt-4 text-center text-[11.5px] text-white/35">
              By applying you confirm you hold a valid licence to store and sell fireworks in your
              state.
            </p>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
