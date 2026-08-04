"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SITE, waLink } from "@/lib/slug";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", subject: "Bulk order enquiry", message: "" });
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setState(null);
    const res = await fetch("/api/v1/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setBusy(false);
    setState({ ok: json.success, msg: json.success ? json.message : json.message });
    if (json.success) setForm({ name: "", mobile: "", email: "", subject: "Bulk order enquiry", message: "" });
  }

  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">Contact</span>
      </nav>

      <header className="mt-10 max-w-2xl">
        <span className="text-[11px] uppercase tracking-[4px] text-gold">We reply within 30 minutes</span>
        <h1 className="mt-5 font-display text-[36px] font-bold leading-tight sm:text-[46px]">
          Talk to the <span className="gold-text">Sivakasi sales desk</span>
        </h1>
        <p className="mt-4 text-[15px] text-white/55">
          Bulk orders, temple festivals, wedding shows, dealer pricing or export enquiries — a real
          human from our factory picks up.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <Reveal>
          <form onSubmit={submit} className="glass rounded-[30px] p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Your name *</span>
                <input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Mobile *</span>
                <input
                  required
                  className="field"
                  value={form.mobile}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Email</span>
                <input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Subject</span>
                <select
                  className="field cursor-pointer bg-black/60"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                >
                  {["Bulk order enquiry", "Dealer / wholesale", "Wedding or event show", "Product question", "Transport & dispatch", "Other"].map((s) => (
                    <option key={s} className="bg-black">{s}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] uppercase tracking-[2px] text-white/40">Message *</span>
                <textarea
                  required
                  className="field min-h-[140px]"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us quantity, festival date, delivery city and budget…"
                />
              </label>
            </div>

            {state && (
              <p className={`mt-5 rounded-xl border p-3 text-[13px] ${state.ok ? "border-verde/40 bg-verde/8 text-verde" : "border-ember/40 bg-ember/10 text-ember"}`}>
                {state.msg}
              </p>
            )}

            <button disabled={busy} className="btn-gold mt-6 flex items-center gap-2 px-8 py-3.5 text-sm uppercase disabled:opacity-50">
              <Send size={15} /> {busy ? "Sending…" : "Send enquiry"}
            </button>
          </form>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-4">
            {[
              { icon: Phone, t: "Call sales", d: SITE.phone, href: `tel:${SITE.phoneRaw}` },
              { icon: MessageCircle, t: "WhatsApp", d: "Instant price list & photos", href: waLink("Hi Mayilon Crackers!") },
              { icon: Mail, t: "Email", d: SITE.email, href: `mailto:${SITE.email}` },
            ].map((c) => (
              <a
                key={c.t}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="glass lift-card flex items-center gap-4 rounded-[24px] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10">
                  <c.icon size={17} className="text-gold" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[2px] text-white/40">{c.t}</p>
                  <p className="text-[14px] text-white">{c.d}</p>
                </div>
              </a>
            ))}

            <div className="glass rounded-[24px] p-6">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="mt-1 text-gold" />
                <div>
                  <p className="text-[11px] uppercase tracking-[2px] text-white/40">Factory & office</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{SITE.address}</p>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3">
                <Clock size={17} className="mt-1 text-gold" />
                <div>
                  <p className="text-[11px] uppercase tracking-[2px] text-white/40">Working hours</p>
                  <p className="mt-1 text-[13.5px] text-white/70">
                    Mon – Sat · 9:00 AM to 7:00 PM IST
                    <br />
                    Festival season: open all days
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-[24px] border-gold/35 p-6">
              <p className="text-[11px] uppercase tracking-[2px] text-gold">Minimum order</p>
              <p className="mt-2 text-[13.5px] text-white/60">
                ₹3,000 for Tamil Nadu & Puducherry · ₹5,000 for other states. Free transport above
                ₹50,000.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
