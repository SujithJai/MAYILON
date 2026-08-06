import type { Metadata } from "next";
import Link from "next/link";
import { WhyUs } from "@/components/home/Sections";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IMAGE_POOL } from "@/lib/seed-data";
import { SITE } from "@/lib/slug";

export const metadata: Metadata = {
  title: "About Mayilon Crackers — Sivakasi Fireworks Manufacturer Since 1994",
  description:
    "Three generations of Sivakasi pyrotechnic craftsmanship. PESO licensed manufacturing, in-house QC lab, factory-direct pricing and nationwide compliant dispatch.",
  alternates: { canonical: `${SITE.url}/about` },
};

const VALUES = [
  { t: "Quality Without Compromise", d: "Every batch is tested for fuse integrity, moisture resistance and burn consistency before it leaves the floor." },
  { t: "Safety First, Always", d: "PESO-compliant manufacturing, storage and transport. Safety leaflets ship with every carton." },
  { t: "Fair, Transparent Pricing", d: "One price list for everyone. No inflated MRP games, no hidden transport markups." },
  { t: "Tradition With Technology", d: "Hand-rolled craft heritage combined with a modern digital estimate and dispatch platform." },
];

export default function AboutPage() {
  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">About Us</span>
      </nav>

      <Reveal className="relative mt-8 overflow-hidden rounded-[34px] border border-red-500/20 bg-slate-950 text-white shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGE_POOL[2]} alt="Mayilon Crackers Sivakasi" className="h-[340px] w-full object-cover opacity-35 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/80 to-slate-950/90" />
        <div className="absolute inset-0 flex flex-col justify-center gap-4 p-10 lg:p-16">
          <span className="text-[11px] font-bold uppercase tracking-[4px] text-red-200">Sivakasi · Est. 1994</span>
          <h1 className="max-w-2xl font-display text-[34px] font-bold leading-tight text-white sm:text-[48px]">
            We Make the Light That <span className="underline decoration-red-400">India Celebrates With</span>
          </h1>
          <p className="max-w-xl text-[15px] font-medium text-red-100/90">{SITE.tagline}</p>
        </div>
      </Reveal>

      <section className="grid gap-10 py-16 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-[30px] font-bold leading-tight text-slate-900">
            From a single hand-rolling shed to a <span className="gold-text">licensed manufacturing unit</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="space-y-4 text-[15px] leading-relaxed text-slate-600 font-medium">
            <p>
              Mayilon Crackers began in 1994 in a small shed off Sattur Main Road, Sivakasi — the
              town that produces the overwhelming majority of India&apos;s fireworks. What started
              with four artisans hand-rolling flower pots now runs as a fully PESO-licensed unit with
              a dedicated chemical lab, quality bench and packing line.
            </p>
            <p>
              The peacock in our emblem is the மயில் of our name — the state bird of Tamil Nadu, and
              the symbol of colour and celebration. The vel beside it stands for precision: every
              shell, every fuse, every gram of composition measured the same way, every single time.
            </p>
            <p>
              In 2015 we made the decision that defines us today — sell directly to families,
              temples and event teams at the same rate our distributors pay. That is why our prices
              sit 78–88% below printed MRP while our quality bench stays untouched.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="py-10">
        <SectionHeading
          eyebrow="Our Values"
          title={
            <>
              What We Refuse to <span className="gold-text">Compromise On</span>
            </>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.t} delay={i * 0.06}>
              <div className="glass lift-card h-full rounded-[28px] p-7 border border-red-500/15 bg-white shadow-md">
                <h3 className="font-display text-[18px] font-bold text-red-600">{v.t}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600 font-medium">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-16">
        <SectionHeading
          eyebrow="Milestones"
          title={
            <>
              Three Decades of <span className="gold-text">Sivakasi Craft</span>
            </>
          }
        />
        <WhyUs />
      </section>

      <section className="glass rounded-[30px] p-10 text-center border border-red-500/20 bg-white shadow-lg">
        <h3 className="font-display text-[26px] font-bold text-slate-900">
          Visit Our <span className="gold-text">Sivakasi Facility</span>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] font-medium text-slate-600">{SITE.address}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          <Link href="/contact" className="btn-gold px-7 py-3.5 text-sm uppercase font-bold">Contact Us</Link>
          <Link href="/dealers" className="btn-ghost px-7 py-3.5 text-sm uppercase font-bold">Become a Dealer</Link>
        </div>
      </section>
    </div>
  );
}
