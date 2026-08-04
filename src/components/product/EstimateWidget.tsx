"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Minus, Phone, Plus, Share2 } from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";
import { SITE, waLink } from "@/lib/slug";

type P = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  categoryName: string;
  packing: string;
  imageUrl: string | null;
  mrp: number;
  price: number;
  dealerPrice: number | null;
  moq: number;
  stock: number;
  discountPercent: number;
};

export function EstimateWidget({ p }: { p: P }) {
  const { add, items } = useEstimate();
  const [qty, setQty] = useState(p.moq);
  const [wish, setWish] = useState(false);
  const inEstimate = items.find((i) => i.id === p.id);

  const lineTotal = qty * p.price;
  const savings = qty * (p.mrp - p.price);

  return (
    <div className="glass rounded-[30px] p-6">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div>
          <p className="text-[11px] uppercase tracking-[3px] text-white/40">Offer price</p>
          <p className="font-display text-[40px] font-bold leading-none text-gold">
            {formatINR(p.price)}
          </p>
        </div>
        <div className="pb-1">
          <p className="text-[15px] text-white/35 line-through">{formatINR(p.mrp)}</p>
          <p className="text-[12.5px] font-semibold text-verde">
            {p.discountPercent}% off · save {formatINR(p.mrp - p.price)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
        <Info label="Packing" value={p.packing} />
        <Info label="MOQ" value={`${p.moq} unit${p.moq > 1 ? "s" : ""}`} />
        <Info label="GST" value="18% (included in estimate)" />
        <Info
          label="Wholesale"
          value={p.dealerPrice ? `${formatINR(p.dealerPrice)} / unit` : "On request"}
        />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-gold/25 bg-black/40 p-3">
        <span className="pl-2 text-[12.5px] uppercase tracking-[2px] text-white/50">Quantity</span>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(p.moq, q - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 text-gold transition hover:bg-gold/15"
          >
            <Minus size={14} />
          </motion.button>
          <input
            value={qty}
            onChange={(e) => setQty(Math.max(p.moq, Math.min(9999, Number(e.target.value) || p.moq)))}
            className="no-spin w-16 rounded-xl border border-white/10 bg-transparent py-2 text-center font-display text-lg font-semibold text-white outline-none focus:border-gold"
            inputMode="numeric"
          />
          <motion.button
            whileTap={{ scale: 0.85 }}
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(9999, q + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/30 text-gold transition hover:bg-gold/15"
          >
            <Plus size={14} />
          </motion.button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gold/8 px-4 py-3">
        <span className="text-[12.5px] text-white/60">Line total</span>
        <div className="text-right">
          <p className="font-display text-[22px] font-bold text-gold">{formatINR(lineTotal)}</p>
          <p className="text-[11px] text-verde">You save {formatINR(savings)}</p>
        </div>
      </div>

      <button
        onClick={() =>
          add(
            {
              id: p.id,
              sku: p.sku,
              slug: p.slug,
              name: p.name,
              categoryName: p.categoryName,
              packing: p.packing,
              imageUrl: p.imageUrl,
              mrp: p.mrp,
              price: p.price,
              moq: p.moq,
            },
            qty,
          )
        }
        className="btn-gold mt-5 w-full py-3.5 text-sm uppercase"
      >
        {inEstimate ? `Add ${qty} more to estimate` : "Add to estimate"}
      </button>

      {inEstimate && (
        <Link
          href="/estimate"
          className="mt-3 block text-center text-[12.5px] text-gold underline-offset-4 hover:underline"
        >
          {inEstimate.quantity} already in your estimate — review it →
        </Link>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <a
          href={waLink(`Hi Mayilon, I need a quote for ${p.name} (${p.sku}) — qty ${qty}.`)}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost py-2.5 text-center text-[12px]"
        >
          WhatsApp
        </a>
        <a href={`tel:${SITE.phoneRaw}`} className="btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-[12px]">
          <Phone size={13} /> Call
        </a>
        <button
          onClick={() => setWish((w) => !w)}
          className={`btn-ghost flex items-center justify-center gap-1.5 py-2.5 text-[12px] ${
            wish ? "border-ember/60 text-ember" : ""
          }`}
        >
          <Heart size={13} fill={wish ? "currentColor" : "none"} /> Save
        </button>
      </div>

      <button
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.share) {
            void navigator.share({ title: p.name, url: window.location.href });
          } else if (typeof navigator !== "undefined") {
            void navigator.clipboard.writeText(window.location.href);
          }
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 text-[12px] text-white/45 transition hover:text-gold"
      >
        <Share2 size={13} /> Share this product
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5">
      <p className="text-[10px] uppercase tracking-[2px] text-white/35">{label}</p>
      <p className="mt-0.5 text-white/80">{value}</p>
    </div>
  );
}
