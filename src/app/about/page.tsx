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
  { t: "Quality without compromise", d: "Every batch is tested for fuse integrity, moisture resistance and burn consistency before it leaves the floor." },
  { t: "Safety first, always", d: "PESO-compliant manufacturing, storage and transport. Safety leaflets ship with every carton." },
  { t: "Fair, transparent pricing", d: "One price list for everyone. No inflated MRP games, no hidden transport markups." },
  { t: "Tradition with technology", d: "Hand-rolled craft heritage combined with a modern digital estimate and dispatch platform." },
];

export default function AboutPage() {
  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">About</span>
      </nav>

      <Reveal className="relative mt-8 overflow-hidden rounded-[34px] border border-gold/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGE_POOL[2]} alt="Mayilon Crackers Sivakasi" className="h-[340px] w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(5,5,5,0.96),rgba(5,5,5,0.5))]" />
        <div className="absolute inset-0 flex flex-col justify-center gap-4 p-10 lg:p-16">
          <span className="text-[11px] uppercase tracking-[4px] text-gold">Sivakasi · Est. 1994</span>
          <h1 className="max-w-2xl font-display text-[34px] font-bold leading-tight sm:text-[48px]">
            We make the light that <span className="gold-text">India celebrates with</span>
          </h1>
          <p className="max-w-xl text-[14.5px] text-white/60">{SITE.tagline}</p>
        </div>
      </Reveal>

      <section className="grid gap-10 py-20 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-[30px] font-bold leading-tight">
            From a single hand-rolling shed to a <span className="gold-text">licensed manufacturing unit</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="space-y-4 text-[14.5px] leading-relaxed text-white/60">
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
          eyebrow="Our values"
          title={
            <>
              What we refuse to <span className="gold-text">compromise on</span>
            </>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.t} delay={i * 0.06}>
              <div className="glass lift-card h-full rounded-[28px] p-7">
                <h3 className="font-display text-[18px] font-semibold text-gold">{v.t}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/55">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-20">
        <SectionHeading
          eyebrow="Milestones"
          title={
            <>
              Three decades of <span className="gold-text">Sivakasi craft</span>
            </>
          }
        />
        <WhyUs />
      </section>

      <section className="glass rounded-[30px] p-10 text-center">
        <h3 className="font-display text-[26px] font-bold text-white">
          Visit our <span className="gold-text">Sivakasi facility</span>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-[14px] text-white/55">{SITE.address}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          <Link href="/contact" className="btn-gold px-7 py-3.5 text-sm uppercase">Contact us</Link>
          <Link href="/dealers" className="btn-ghost px-7 py-3.5 text-sm uppercase">Become a dealer</Link>
        </div>
      </section>
    </div>
  );
}
