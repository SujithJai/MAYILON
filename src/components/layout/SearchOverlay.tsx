"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/estimate";

type Hit = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  offerPrice: string;
  mrp: string;
  imageUrl: string | null;
  categoryName: string;
};

const QUICK = ["Sky Shot", "Rocket", "Flower Pot", "Sparklers", "Gift Box", "Chakkar"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(term)}`);
        const json = await res.json();
        setHits(json?.data?.products ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [q, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-start justify-center bg-black/80 px-4 pt-24 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-dark w-full max-w-2xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-gold/15 px-5 py-4">
              <Search size={18} className="text-gold" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search 60+ products, SKU codes or categories…"
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
              />
              <button onClick={onClose} aria-label="Close search" className="text-white/40 hover:text-gold">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-3">
              {q.trim().length < 2 && (
                <div className="p-3">
                  <p className="mb-3 text-[11px] uppercase tracking-[3px] text-white/40">
                    Popular searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((k) => (
                      <button
                        key={k}
                        onClick={() => setQ(k)}
                        className="rounded-full border border-gold/25 px-3.5 py-1.5 text-xs text-white/70 transition hover:border-gold hover:text-gold"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && <p className="p-4 text-sm text-white/50">Searching…</p>}

              {!loading && q.trim().length >= 2 && hits.length === 0 && (
                <p className="p-4 text-sm text-white/50">No products matched “{q}”.</p>
              )}

              {hits.map((h) => (
                <Link
                  key={h.id}
                  href={`/products/${h.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-gold/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={h.imageUrl ?? ""}
                    alt={h.name}
                    className="h-12 w-12 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{h.name}</p>
                    <p className="text-[11px] uppercase tracking-[2px] text-white/40">
                      {h.sku} · {h.categoryName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gold">{formatINR(Number(h.offerPrice))}</p>
                    <p className="text-[11px] text-white/35 line-through">{formatINR(Number(h.mrp))}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
