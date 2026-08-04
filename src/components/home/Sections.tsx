"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  Factory,
  Flame,
  IndianRupee,
  Minus,
  PackageCheck,
  Plus,
  Quote,
  Search,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { formatINR } from "@/lib/estimate";
import type { CategorySummary } from "@/lib/data";
import { HOME_FAQS } from "@/lib/faqs";

/* ------------------------------- Features ------------------------------- */

const FEATURES = [
  {
    icon: Award,
    title: "Premium Quality",
    body: "High-purity chemical composition, precision-rolled casings and batch-tested fuses on every single unit.",
    color: "#D4AF37",
  },
  {
    icon: Factory,
    title: "Factory Direct Price",
    body: "No middlemen. You buy at the same rate our distributors do — up to 80% off printed MRP.",
    color: "#FF8C00",
  },
  {
    icon: Users,
    title: "Wholesale Orders",
    body: "Tiered dealer pricing, credit terms, bulk Excel ordering and dedicated account managers.",
    color: "#0057FF",
  },
  {
    icon: PackageCheck,
    title: "Safe Packaging",
    body: "Double-layer corrugated cartons, moisture barriers and PESO-compliant transport documentation.",
    color: "#00D26A",
  },
];

export function Features() {
  return (
    <section className="shell py-8">
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title} className="h-full">
            <div className="glass lift-card group h-full rounded-[30px] p-7">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
                style={{ background: `${f.color}1f`, border: `1px solid ${f.color}55` }}
              >
                <f.icon size={21} style={{ color: f.color }} />
              </div>
              <h3 className="font-display text-[17px] font-semibold text-white">{f.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/50">{f.body}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

/* ------------------------------ Categories ------------------------------ */

export function CategoryGrid({ categories }: { categories: CategorySummary[] }) {
  return (
    <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <StaggerItem key={c.id} className="h-full">
          <Link href={`/products?category=${c.slug}`} className="group block h-full">
            <div className="glass lift-card relative h-full overflow-hidden rounded-[30px]">
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl ?? ""}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent" />
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 50% 100%, ${c.accent}44, transparent 60%)` }}
                />
                <span className="glass-dark absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] text-gold">
                  {c.productCount} items
                </span>
              </div>
              <div className="p-6">
                <p className="text-[10.5px] uppercase tracking-[3px]" style={{ color: c.accent }}>
                  {c.nameTa}
                </p>
                <h3 className="mt-1.5 font-display text-[19px] font-semibold text-white transition-colors duration-400 group-hover:text-gold">
                  {c.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-[13px] text-white/50">{c.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[2px] text-gold opacity-70 transition-all duration-500 group-hover:gap-3.5 group-hover:opacity-100">
                  Browse collection →
                </span>
              </div>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}

/* ------------------------------- Why Us --------------------------------- */

const TIMELINE = [
  { year: "1994", title: "Founded in Sivakasi", body: "Three generations of pyrotechnic craftsmanship in the fireworks capital of India." },
  { year: "2006", title: "PESO Licensed Expansion", body: "Full-scale licensed manufacturing with in-house chemical lab and QC bench." },
  { year: "2015", title: "Direct-to-Customer Pricing", body: "We removed the distributor layer so families pay factory rates, not retail markups." },
  { year: "2020", title: "Nationwide Transport Network", body: "Partnered with 40+ registered transporters for compliant pan-India dispatch." },
  { year: "2026", title: "Digital Estimate Platform", body: "Instant online estimates, dealer portal and live order tracking — this platform." },
];

export function WhyUs() {
  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-gradient-to-b from-gold/70 via-gold/25 to-transparent md:left-1/2" />
      <div className="space-y-10">
        {TIMELINE.map((t, i) => (
          <Reveal key={t.year} delay={i * 0.06}>
            <div
              className={`relative flex gap-6 md:w-1/2 ${
                i % 2 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"
              }`}
            >
              <span
                className={`absolute top-2 flex h-3 w-3 items-center justify-center rounded-full bg-gold shadow-[0_0_18px_4px_rgba(212,175,55,0.5)] ${
                  i % 2 ? "left-[13px] md:-left-[6px]" : "left-[13px] md:-right-[6px] md:left-auto"
                }`}
              />
              <div className="glass ml-10 flex-1 rounded-[26px] p-6 md:ml-0">
                <p className="font-display text-[13px] font-bold tracking-[3px] text-gold">{t.year}</p>
                <h4 className="mt-1.5 font-display text-[18px] font-semibold text-white">{t.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{t.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Reviews -------------------------------- */

type ReviewRow = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
};

export function ReviewCarousel({ reviews }: { reviews: ReviewRow[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % Math.max(1, reviews.length)), 5200);
    return () => window.clearInterval(id);
  }, [reviews.length]);

  if (!reviews.length) return null;
  const r = reviews[i];

  return (
    <div className="relative mx-auto max-w-3xl" style={{ perspective: "1200px" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={r.id}
          initial={{ opacity: 0, rotateX: 18, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, rotateX: -14, y: -30 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-[34px] p-9 text-center"
        >
          <Quote size={34} className="mx-auto text-gold/50" />
          <div className="mt-5 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, k) => (
              <Star
                key={k}
                size={15}
                className={k < r.rating ? "text-gold" : "text-white/15"}
                fill="currentColor"
              />
            ))}
          </div>
          <h4 className="mt-5 font-display text-xl font-semibold text-white">{r.title}</h4>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">{r.body}</p>
          <p className="mt-6 text-[13px] font-medium text-gold">{r.name}</p>
          <p className="text-[11.5px] uppercase tracking-[2px] text-white/35">{r.location}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-7 flex justify-center gap-2">
        {reviews.map((rev, k) => (
          <button
            key={rev.id}
            aria-label={`Review ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              k === i ? "w-9 bg-gold" : "w-3 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------- Quick calculator ---------------------------- */

type CalcProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  packing: string;
  moq: number;
  mrp: string;
  offerPrice: string;
  imageUrl: string | null;
  categoryName: string;
};

export function QuickCalculator({ products }: { products: CalcProduct[] }) {
  const { add, totals, items } = useEstimate();
  const [q, setQ] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? products.filter(
          (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term),
        )
      : products;
    return list.slice(0, 6);
  }, [q, products]);

  const runningTotal = filtered.reduce(
    (s, p) => s + Number(p.offerPrice) * (qty[p.id] ?? 0),
    0,
  );

  return (
    <div className="glass overflow-hidden rounded-[34px]">
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        <div className="border-b border-gold/12 p-7 lg:border-b-0 lg:border-r">
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a product to price it instantly…"
              className="field pl-11"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filtered.map((p) => {
              const n = qty[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/3 p-3 transition-colors duration-400 hover:border-gold/35"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-white">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-semibold text-gold sm:hidden">
                        {formatINR(Number(p.offerPrice))}
                      </span>
                      <span className="uppercase tracking-[1.5px] text-white/35">
                        {p.sku} · {p.packing}
                      </span>
                    </div>
                  </div>
                  <p className="hidden text-sm font-semibold text-gold sm:block">
                    {formatINR(Number(p.offerPrice))}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      aria-label="decrease"
                      onClick={() => setQty((s) => ({ ...s, [p.id]: Math.max(0, n - 1) }))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 text-gold transition hover:bg-gold/15 active:scale-90"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">{n}</span>
                    <button
                      aria-label="increase"
                      onClick={() => setQty((s) => ({ ...s, [p.id]: n + 1 }))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gold/25 text-gold transition hover:bg-gold/15 active:scale-90"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between p-7">
          <div>
            <p className="text-[11px] uppercase tracking-[3px] text-gold">Live calculation</p>
            <p className="mt-4 font-display text-[38px] font-bold text-white">
              {formatINR(runningTotal)}
            </p>
            <p className="text-[12.5px] text-white/45">
              {Object.values(qty).reduce((a, b) => a + b, 0)} units selected here
            </p>

            <div className="mt-6 space-y-2 border-t border-white/8 pt-5 text-[13px]">
              <div className="flex justify-between text-white/55">
                <span>In your estimate</span>
                <span className="text-white">{items.length} products</span>
              </div>
              <div className="flex justify-between text-white/55">
                <span>Estimate subtotal</span>
                <span className="text-gold">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-white/55">
                <span>You save</span>
                <span className="text-verde">{formatINR(totals.savings)}</span>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <button
              onClick={() => {
                filtered.forEach((p) => {
                  const n = qty[p.id] ?? 0;
                  if (n > 0) {
                    add(
                      {
                        id: p.id,
                        sku: p.sku,
                        slug: p.slug,
                        name: p.name,
                        categoryName: p.categoryName,
                        packing: p.packing,
                        imageUrl: p.imageUrl,
                        mrp: Number(p.mrp),
                        price: Number(p.offerPrice),
                        moq: p.moq,
                      },
                      n,
                    );
                  }
                });
                setQty({});
              }}
              className="btn-gold w-full py-3 text-sm uppercase"
            >
              Add selection to estimate
            </button>
            <Link href="/estimate" className="btn-ghost block w-full py-3 text-center text-sm uppercase">
              Open full estimate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- FAQ ---------------------------------- */

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {HOME_FAQS.map((f, i) => (
        <Reveal key={f.q} delay={i * 0.04}>
          <div
            className={`glass overflow-hidden rounded-[24px] transition-colors duration-500 ${
              open === i ? "border-gold/50" : ""
            }`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-5 p-6 text-left"
            >
              <span className="font-display text-[15.5px] font-medium text-white">{f.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-gold transition-transform duration-500 ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-[14px] leading-relaxed text-white/55">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------ Stat strip ------------------------------ */

export function StatStrip() {
  const stats = [
    { icon: Flame, k: "60+", v: "Premium SKUs" },
    { icon: IndianRupee, k: "₹3,000", v: "Min order (TN)" },
    { icon: Truck, k: "48 hrs", v: "Dispatch time" },
    { icon: Users, k: "1,284", v: "Verified reviews" },
  ];
  return (
    <div className="glass grid gap-6 rounded-[30px] p-8 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.v} className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/35 bg-gold/10">
            <s.icon size={18} className="text-gold" />
          </div>
          <div>
            <p className="font-display text-[21px] font-bold text-white">{s.k}</p>
            <p className="text-[11px] uppercase tracking-[2px] text-white/40">{s.v}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
