"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Plus, Star } from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";

export type CardProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  mrp: string | number;
  offerPrice: string | number;
  discountPercent: number;
  packing: string;
  moq: number;
  stock: number;
  rating: string | number;
  reviewCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isPremium?: boolean;
  categoryName: string;
  categoryAccent?: string;
};

export function ProductCard({ p, index = 0 }: { p: CardProduct; index?: number }) {
  const { add } = useEstimate();
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 9, y: px * 11 });
  }

  const mrp = Number(p.mrp);
  const price = Number(p.offerPrice);
  const accent = p.categoryAccent ?? "#D4AF37";

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
        className="glass lift-card relative flex h-full flex-col overflow-hidden rounded-[30px] transition-transform duration-300"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl ?? ""}
            alt={p.name}
            loading="lazy"
            className="h-full w-full scale-[1.02] object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: `radial-gradient(circle at 50% 90%, ${accent}33, transparent 62%)` }}
          />

          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
              {p.discountPercent}% Off
            </span>
            {p.isNewArrival && (
              <span className="rounded-full bg-royal px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                New
              </span>
            )}
            {p.isBestSeller && (
              <span className="rounded-full bg-ember px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Best Seller
              </span>
            )}
            {p.isPremium && (
              <span className="glass rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                Premium
              </span>
            )}
          </div>

          <Link
            href={`/products/${p.slug}`}
            aria-label={`View ${p.name}`}
            className="glass-dark absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-xl text-gold opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye size={15} />
          </Link>

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/70">
            <span className="uppercase tracking-[2px]">{p.sku}</span>
            <span className="flex items-center gap-1 text-gold">
              <Star size={11} fill="currentColor" /> {Number(p.rating).toFixed(1)}
              <span className="text-white/40">({p.reviewCount})</span>
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-[10.5px] uppercase tracking-[2.6px]" style={{ color: accent }}>
            {p.categoryName}
          </p>
          <Link href={`/products/${p.slug}`} className="mt-1.5">
            <h3 className="font-display text-[16px] font-semibold leading-snug text-white transition-colors duration-400 group-hover:text-gold">
              {p.name}
            </h3>
          </Link>
          <p className="mt-1 text-[11.5px] text-white/40">
            {p.packing} · MOQ {p.moq}
          </p>

          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-white/35 line-through">{formatINR(mrp)}</p>
                <p className="font-display text-[22px] font-bold text-gold">{formatINR(price)}</p>
              </div>
              <span
                className={`text-[11px] ${p.stock > 60 ? "text-verde" : "text-flame"}`}
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
              className="btn-gold mt-4 flex w-full items-center justify-center gap-2 py-2.5 text-[12.5px] uppercase"
            >
              <Plus size={15} /> Add to Estimate
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
