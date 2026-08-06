"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, Plus, Star, X, ZoomIn } from "lucide-react";
import { useState, useRef } from "react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";

export type CardProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  categoryName: string;
  packing: string;
  moq: number;
  mrp: string | number;
  offerPrice: string | number;
  discountPercent: number;
  imageUrl: string | null;
  rating: string | number;
  reviewCount: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
  stock: number;
};

export function ProductCard({ p, index = 0 }: { p: CardProduct; index?: number }) {
  const { add } = useEstimate();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const mrp = Number(p.mrp);
  const price = Number(p.offerPrice);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 8, y: px * 8 });
  };

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    add({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      categoryName: p.categoryName,
      packing: p.packing,
      imageUrl: p.imageUrl,
      mrp,
      price,
      moq: p.moq,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: 1200 }}
        className="group relative h-full"
      >
        <div
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
          className="glass lift-card relative flex h-full flex-col overflow-hidden rounded-[30px] border border-red-500/15 bg-white shadow-md transition-transform duration-300"
        >
          <div
            onClick={() => setLightboxOpen(true)}
            className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl ?? ""}
              alt={p.name}
              loading="lazy"
              className="h-full w-full scale-[1.02] object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />

            <div className="absolute left-4 top-4 flex flex-col gap-1.5 z-10">
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                {p.discountPercent}% Off
              </span>
              {p.isNewArrival && (
                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
              )}
              {p.isBestSeller && (
                <span className="rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Best Seller
                </span>
              )}
              {p.isPremium && (
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Premium
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label={`View photo of ${p.name}`}
              className="absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-xl bg-white/95 text-red-600 shadow-md opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white z-10"
            >
              <ZoomIn size={16} />
            </button>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white font-medium z-10">
              <span className="uppercase tracking-[2px] opacity-90">{p.sku}</span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Star size={11} fill="currentColor" /> {Number(p.rating).toFixed(1)}
                <span className="text-white/70">({p.reviewCount})</span>
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5 bg-white">
            <p className="text-[10.5px] font-bold uppercase tracking-[2.6px] text-red-600">
              {p.categoryName}
            </p>
            <Link href={`/products/${p.slug}`} className="mt-1.5">
              <h3 className="font-display text-[16px] font-bold leading-snug text-slate-900 transition-colors duration-400 group-hover:text-red-600">
                {p.name}
              </h3>
            </Link>
            <p className="mt-1 text-[11.5px] font-medium text-slate-500">
              {p.packing} · MOQ {p.moq}
            </p>

            <div className="mt-auto pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 line-through">{formatINR(mrp)}</p>
                  <p className="font-display text-[22px] font-bold text-red-600">{formatINR(price)}</p>
                </div>
                <span
                  className={`text-[11px] font-bold ${p.stock > 60 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {p.stock > 60 ? "In Stock" : `Only ${p.stock} left`}
                </span>
              </div>

              <button
                onClick={handleAdd}
                className={`mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-[12.5px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  added ? "bg-emerald-600 text-white rounded-[18px] shadow-md" : "btn-gold"
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} /> Added +1
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Add to Estimate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-red-500/20 bg-white shadow-2xl sm:flex-row"
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-red-600"
              >
                <X size={18} />
              </button>

              <div className="relative aspect-square w-full sm:w-1/2 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl ?? ""}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase text-white shadow">
                  {p.discountPercent}% Off
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-red-600">
                  {p.categoryName} · {p.sku}
                </span>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">{p.name}</h3>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Packing: {p.packing} · Minimum Order Quantity: {p.moq} pcs
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-red-600">
                    {formatINR(price)}
                  </span>
                  <span className="text-sm font-medium text-slate-400 line-through">
                    {formatINR(mrp)}
                  </span>
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={() => {
                      handleAdd();
                    }}
                    className={`flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                      added ? "bg-emerald-600 text-white rounded-[18px]" : "btn-gold"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={18} /> Added to Estimate
                      </>
                    ) : (
                      <>
                        <Plus size={18} /> Add to Estimate
                      </>
                    )}
                  </button>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={() => setLightboxOpen(false)}
                    className="mt-3 block text-center text-xs font-bold uppercase text-slate-500 hover:text-red-600"
                  >
                    View Full Product Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
