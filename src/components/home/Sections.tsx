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
    color: "#DC2626",
  },
  {
    icon: Factory,
    title: "Factory Direct Price",
    body: "No middlemen. You buy at the same rate our distributors do — up to 80% off printed MRP.",
    color: "#EA580C",
  },
  {
    icon: Users,
    title: "Wholesale Orders",
    body: "Tiered dealer pricing, credit terms, bulk Excel ordering and dedicated account managers.",
    color: "#2563EB",
  },
  {
    icon: PackageCheck,
    title: "Safe Packaging",
    body: "Double-layer corrugated cartons, moisture barriers and PESO-compliant transport documentation.",
    color: "#16A34A",
  },
];

export function Features() {
  return (
    <section className="shell py-8">
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title} className="h-full">
            <div className="glass lift-card group h-full rounded-[30px] p-7 border border-red-500/15 bg-white/95">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}40` }}
              >
                <f.icon size={21} style={{ color: f.color }} />
              </div>
              <h3 className="font-display text-[17px] font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-600">{f.body}</p>
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
            <div className="glass lift-card relative h-full overflow-hidden rounded-[30px] border border-red-500/15 bg-white">
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl ?? ""}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <span className="glass-dark absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold text-red-600 border border-red-200">
                  {c.productCount} items
                </span>
              </div>
              <div className="p-6">
                <p className="text-[10.5px] font-bold uppercase tracking-[3px] text-red-600">
                  {c.nameTa}
                </p>
                <h3 className="mt-1.5 font-display text-[19px] font-bold text-slate-900 transition-colors duration-400 group-hover:text-red-600">
                  {c.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-[13px] text-slate-600">{c.tagline}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[2px] text-red-600 transition-all duration-500 group-hover:gap-3.5">
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
      <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-gradient-to-b from-red-600 via-red-300 to-transparent md:left-1/2" />
      <div className="space-y-10">
        {TIMELINE.map((t, i) => (
          <Reveal key={t.year} delay={i * 0.06}>
            <div
              className={`relative flex gap-6 md:w-1/2 ${
                i % 2 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"
              }`}
            >
              <span
                className={`absolute top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 shadow-[0_0_14px_rgba(220,38,38,0.6)] ${
                  i % 2 ? "left-[12px] md:-left-[7px]" : "left-[12px] md:-right-[7px] md:left-auto"
                }`}
              />
              <div className="glass ml-10 flex-1 rounded-[26px] p-6 border border-red-500/15 bg-white md:ml-0 shadow-md">
                <p className="font-display text-[13px] font-bold tracking-[3px] text-red-600">{t.year}</p>
                <h4 className="mt-1.5 font-display text-[18px] font-bold text-slate-900">{t.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{t.body}</p>
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
    <div className="mx-auto max-w-3xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={r.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-[34px] p-9 text-center border border-red-500/15 bg-white shadow-lg"
        >
          <Quote size={34} className="mx-auto text-red-500/40" />
          <div className="mt-5 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, k) => (
              <Star
                key={k}
                size={16}
                className={k < r.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"}
              />
            ))}
          </div>
          <h4 className="mt-5 font-display text-xl font-bold text-slate-900">{r.title}</h4>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{r.body}</p>
          <p className="mt-6 text-[13px] font-bold text-red-600">{r.name}</p>
          <p className="text-[11.5px] uppercase tracking-[2px] text-slate-400">{r.location}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-7 flex justify-center gap-2">
        {reviews.map((rev, k) => (
          <button
            key={rev.id}
            aria-label={`Review ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-2 rounded-full transition-all duration-500 ${
              k === i ? "w-9 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "w-3 bg-slate-300 hover:bg-slate-400"
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
    return term
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.categoryName.toLowerCase().includes(term),
        )
      : products;
  }, [q, products]);

  const runningTotal = products.reduce(
    (s, p) => s + Number(p.offerPrice) * (qty[p.id] ?? 0),
    0,
  );

  return (
    <div className="glass overflow-hidden rounded-[34px] border border-red-500/20 bg-white shadow-xl">
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        <div className="border-b border-red-500/12 p-7 lg:border-b-0 lg:border-r">
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all 110 products to price instantly..."
              className="field pl-11 pr-10 !border-red-500/25 !bg-slate-50 !text-slate-900 focus:!border-red-600 font-bold"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-red-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-[1px] text-slate-500">
            <span>Showing {filtered.length} of {products.length} products</span>
            {q && <button onClick={() => setQ("")} className="text-red-600 hover:underline">Clear Search</button>}
          </div>

          <div className="mt-3 max-h-[500px] space-y-3 overflow-y-auto pr-1.5 hide-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-medium">
                No products match &quot;{q}&quot;. Try searching for &quot;Laxmi&quot;, &quot;Sparklers&quot;, or &quot;Fancy&quot;.
              </div>
            ) : (
              filtered.map((p) => {
                const n = qty[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition-all duration-300 hover:border-red-500/40 hover:bg-red-50/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl ?? ""}
                      alt={p.name}
                      loading="lazy"
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-slate-900">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-red-600 sm:hidden">
                          {formatINR(Number(p.offerPrice))}
                        </span>
                        <span className="uppercase tracking-[1.5px] text-slate-500 font-medium">
                          {p.sku} · {p.packing}
                        </span>
                      </div>
                    </div>
                    <p className="hidden text-sm font-bold text-red-600 sm:block">
                      {formatINR(Number(p.offerPrice))}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label="decrease"
                        onClick={() => {
                          const next = Math.max(0, n - 1);
                          setQty((s) => ({ ...s, [p.id]: next }));
                          if (next > 0) {
                            add(p as any, next);
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-600 hover:text-white active:scale-90"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums text-slate-900">{n}</span>
                      <button
                        aria-label="increase"
                        onClick={() => {
                          const next = n + 1;
                          setQty((s) => ({ ...s, [p.id]: next }));
                          add(p as any, next);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-600 hover:text-white active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between p-7 bg-slate-50/60">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[3px] text-red-600">Live Calculation</p>
            <p className="mt-4 font-display text-[38px] font-bold text-slate-900">
              {formatINR(runningTotal)}
            </p>
            <p className="text-[12.5px] text-slate-500 font-medium">
              {Object.values(qty).reduce((a, b) => a + b, 0)} units selected here
            </p>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>In your estimate</span>
                <span className="font-bold text-slate-900">{items.length} products</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimate subtotal</span>
                <span className="font-bold text-red-600">{formatINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total item count</span>
                <span className="font-bold text-slate-900">{totals.units} pcs</span>
              </div>
            </div>
          </div>

          <div className="mt-7 pt-4">
            <Link
              href="/estimate"
              className="btn-gold block w-full py-3.5 text-center text-sm uppercase"
            >
              Open Full Estimate Sheet →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- FAQ ------------------------------------ */

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {HOME_FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={faq.q}
            className="glass overflow-hidden rounded-[22px] border border-red-500/15 bg-white shadow-sm transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between p-5 text-left text-[15px] font-bold text-slate-900"
            >
              <span>{faq.q}</span>
              <ChevronDown
                size={18}
                className={`text-red-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="border-t border-slate-100 p-5 pt-3 text-[14px] leading-relaxed text-slate-600">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
