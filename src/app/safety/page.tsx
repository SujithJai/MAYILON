import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Flame, ShieldCheck, XCircle } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Fireworks Safety Guide — Do's, Don'ts & Storage Rules",
  description:
    "Official Mayilon Crackers safety guidance: safe distances, adult supervision, storage rules, first-aid steps and PESO transport compliance for Indian households and event organisers.",
  alternates: { canonical: `${SITE.url}/safety` },
};

const DOS = [
  "Always burst fireworks outdoors in an open area, at least 10 metres from buildings and vehicles.",
  "Keep two buckets of water and a bag of dry sand within arm's reach at all times.",
  "Light one item at a time, at arm's length, using an agarbatti or long fuse lighter.",
  "Wear cotton clothing — synthetics catch and hold flame.",
  "Adults must supervise every single item, including sparklers.",
  "Soak all used and unused remains in water before disposal.",
];

const DONTS = [
  "Never relight a dud. Wait five minutes, then soak it in water.",
  "Never hold a shell, rocket or sound cracker in your hand while lighting.",
  "Never place fireworks in glass, metal or clay containers.",
  "Never store fireworks near cooking gas, inverters, heaters or direct sunlight.",
  "Never allow children to carry fireworks in pockets.",
  "Never burst crackers inside silent zones — hospitals, schools, courts, places of worship.",
];

const DISTANCES = [
  { t: "Sparklers & Kids Items", d: "1 metre clearance, adult holding distance" },
  { t: "Flower Pots & Chakkar", d: "3 metres from spectators" },
  { t: "Rockets", d: "15 metres clear of overhead wires and trees" },
  { t: "Sky Shots & Aerial Repeaters", d: "25 metres safety cordon, stable flat ground" },
  { t: "Show Packs & Cold Pyro", d: "Operator-certified handling, 30 metres audience line" },
];

export default function SafetyPage() {
  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">Safety Guide</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[3px] text-red-600">
          <AlertTriangle size={14} /> Read Before You Celebrate
        </span>
        <h1 className="mt-5 font-display text-[36px] font-bold leading-tight text-slate-900 sm:text-[48px]">
          Celebrate Bright. <span className="gold-text">Celebrate Safe.</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600 font-medium">
          Fireworks are explosives. Every item we manufacture is tested and PESO compliant, but
          safety on the night depends entirely on how they are handled. This page is the same
          briefing we give our own team.
        </p>
      </header>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full rounded-[30px] border border-emerald-500/30 bg-white p-8 shadow-md">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={22} />
              <h2 className="font-display text-xl font-bold text-slate-900">Always Do</h2>
            </div>
            <ul className="mt-5 space-y-3.5">
              {DOS.map((d) => (
                <li key={d} className="flex gap-3 text-[14px] leading-relaxed font-bold text-slate-800">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="glass h-full rounded-[30px] border border-red-500/30 bg-white p-8 shadow-md">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle size={22} />
              <h2 className="font-display text-xl font-bold text-slate-900">Never Do</h2>
            </div>
            <ul className="mt-5 space-y-3.5">
              {DONTS.map((d) => (
                <li key={d} className="flex gap-3 text-[14px] leading-relaxed font-bold text-slate-800">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-600" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="py-16">
        <SectionHeading
          eyebrow="Safe Distances"
          title={
            <>
              How Far Is <span className="gold-text">Far Enough?</span>
            </>
          }
        />
        <div className="glass overflow-hidden rounded-[30px] border border-red-500/15 bg-white shadow-md">
          {DISTANCES.map((d, i) => (
            <div
              key={d.t}
              className={`flex flex-wrap items-center justify-between gap-3 px-8 py-5 ${
                i < DISTANCES.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <span className="flex items-center gap-3 text-[15px] font-bold text-slate-900">
                <Flame size={16} className="text-red-600" /> {d.t}
              </span>
              <span className="text-[13.5px] font-bold text-slate-600">{d.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            t: "Storage",
            d: "Keep in the original sealed carton, in a cool dry room away from kitchens, electrical panels and direct sun. Never stack above 1.5 metres.",
          },
          {
            icon: AlertTriangle,
            t: "If a Burn Happens",
            d: "Cool the area under running water for 15 minutes. Do not apply oil, toothpaste or ice. Cover with clean cloth and seek medical help for anything larger than a coin.",
          },
          {
            icon: Flame,
            t: "Legal Compliance",
            d: "Follow local time restrictions (typically 8pm–10pm), respect silent zones, and use only green-certified items where mandated by your state pollution board.",
          },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.06}>
            <div className="glass h-full rounded-[28px] p-7 border border-red-500/15 bg-white shadow-md">
              <c.icon size={22} className="text-red-600" />
              <h3 className="mt-4 font-display text-[18px] font-bold text-slate-900">{c.t}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate-600 font-medium">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <div className="glass mt-14 rounded-[30px] p-10 text-center border border-red-500/20 bg-white shadow-lg">
        <p className="text-[15px] font-bold text-slate-700">
          Questions about handling a specific item? Our safety desk answers on WhatsApp.
        </p>
        <Link href="/contact" className="btn-gold mt-6 inline-block px-8 py-3.5 text-sm uppercase font-bold">
          Ask the Safety Desk
        </Link>
      </div>
    </div>
  );
}
