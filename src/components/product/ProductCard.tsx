"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Plus, Star } from "lucide-react";
import { useState, useRef } from "react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";

type ProductProp = {
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

export function ProductCard({ p, index = 0 }: { p: ProductProp; index?: number }) {
  const { add } = useEstimate();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const mrp = Number(p.mrp);
  const price = Number(p.offerPrice);
  const accent = "#DC2626";

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 8, y: px * 8 });
  };

  return (
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
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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

          <Link
            href={`/products/${p.slug}`}
            aria-label={`View ${p.name}`}
            className="absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-xl bg-white/90 text-red-600 shadow-md opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white z-10"
          >
            <Eye size={16} />
          </Link>

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
              onClick={() =>
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
                })
              }
              className="btn-gold mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-[12.5px] font-bold uppercase tracking-wider"
            >
              <Plus size={15} /> Add to Estimate
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
