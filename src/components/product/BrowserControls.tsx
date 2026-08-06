"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CategorySummary } from "@/lib/data";
import { formatINR } from "@/lib/estimate";

const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "newest", l: "Newest First" },
  { v: "price-asc", l: "Price: Low → High" },
  { v: "price-desc", l: "Price: High → Low" },
  { v: "best", l: "Best Selling" },
  { v: "discount", l: "Highest Discount" },
  { v: "alpha", l: "Alphabetical" },
];

const FLAGS = [
  { v: "new", l: "New Arrivals" },
  { v: "best", l: "Best Sellers" },
  { v: "premium", l: "Premium Collection" },
  { v: "featured", l: "Featured" },
];

const PRICE_BANDS = [
  { min: 0, max: 200, l: "Under ₹200" },
  { min: 200, max: 600, l: "₹200 – ₹600" },
  { min: 600, max: 1500, l: "₹600 – ₹1,500" },
  { min: 1500, max: 5000, l: "₹1,500 – ₹5,000" },
  { min: 5000, max: 999999, l: "₹5,000+" },
];

export function BrowserControls({
  categories,
  total,
  view,
  onViewChange,
}: {
  categories: CategorySummary[];
  total: number;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");

  const setParam = useCallback(
    (key: string, value?: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      next.delete("page");
      router.push(`/products?${next.toString()}`, { scroll: false });
    },
    [router, sp],
  );

  const activeCategory = sp.get("category") ?? "all";
  const activeFlag = sp.get("flag");
  const activeMin = sp.get("min");
  const activeMax = sp.get("max");
  const hasFilters = Boolean(sp.get("category") || activeFlag || activeMin || sp.get("q"));

  const Panel = (
    <div className="space-y-8">
      <div>
        <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[3px] text-red-600">
          Category
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => setParam("category", null)}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-[13px] font-bold transition-all duration-300 ${
              activeCategory === "all" ? "bg-red-50 text-red-600 border border-red-200 shadow-sm" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            All Products <span className="text-[11px] opacity-70">{total}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("category", c.slug)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-[13px] font-bold transition-all duration-300 ${
                activeCategory === c.slug ? "bg-red-50 text-red-600 border border-red-200 shadow-sm" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {c.name} <span className="text-[11px] opacity-70">{c.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[3px] text-red-600">
          Price Range
        </h4>
        <div className="space-y-1.5">
          {PRICE_BANDS.map((b) => {
            const active = activeMin === String(b.min) && activeMax === String(b.max);
            return (
              <button
                key={b.l}
                onClick={() => {
                  const next = new URLSearchParams(sp.toString());
                  if (active) {
                    next.delete("min");
                    next.delete("max");
                  } else {
                    next.set("min", String(b.min));
                    next.set("max", String(b.max));
                  }
                  router.push(`/products?${next.toString()}`, { scroll: false });
                }}
                className={`w-full rounded-xl px-3.5 py-2 text-left text-[13px] font-bold transition-all duration-300 ${
                  active ? "bg-red-50 text-red-600 border border-red-200 shadow-sm" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {b.l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-3.5 text-[11px] font-bold uppercase tracking-[3px] text-red-600">
          Collection
        </h4>
        <div className="flex flex-wrap gap-2">
          {FLAGS.map((f) => (
            <button
              key={f.v}
              onClick={() => setParam("flag", activeFlag === f.v ? null : f.v)}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-all duration-300 ${
                activeFlag === f.v
                  ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-red-400"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/products", { scroll: false })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-50 py-2.5 text-[12.5px] font-bold text-red-600 transition hover:bg-red-100"
        >
          <X size={14} /> Clear All Filters
        </button>
      )}

      <div className="rounded-2xl border border-red-500/20 bg-red-50/50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-600">Minimum Order</p>
        <p className="mt-1.5 text-[13px] text-slate-700 font-medium">
          {formatINR(3000)} for Tamil Nadu & Puducherry · {formatINR(5000)} other states
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* top bar */}
      <div className="glass mb-2 flex flex-wrap items-center gap-3 rounded-[24px] p-4 border border-red-500/15 bg-white shadow-md lg:col-span-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q || null);
          }}
          className="relative min-w-[220px] flex-1"
        >
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product name or SKU code…"
            className="field pl-11 !bg-slate-50 !border-red-500/25 !text-slate-900 focus:!border-red-600"
          />
        </form>

        <select
          value={sp.get("sort") ?? "featured"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="field w-auto cursor-pointer !bg-slate-50 !border-red-500/25 !text-slate-900 font-bold py-3 focus:!border-red-600"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v} className="bg-white text-slate-900">
              {s.l}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            aria-label="Grid view"
            onClick={() => onViewChange("grid")}
            className={`rounded-lg p-2 transition ${view === "grid" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            aria-label="List view"
            onClick={() => onViewChange("list")}
            className={`rounded-lg p-2 transition ${view === "list" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            <List size={15} />
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {/* desktop sidebar */}
      <aside className="glass sticky top-28 hidden h-fit rounded-[28px] p-6 border border-red-500/15 bg-white shadow-md lg:block">{Panel}</aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[500] bg-slate-950/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark h-full w-[86%] max-w-sm overflow-y-auto p-6 bg-white border-r border-red-500/20"
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-lg font-bold text-red-600">Filters</p>
                <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                  <X size={18} className="text-slate-600" />
                </button>
              </div>
              {Panel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
