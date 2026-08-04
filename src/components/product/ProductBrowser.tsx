"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { BrowserControls } from "./BrowserControls";
import { ProductCard, type CardProduct } from "./ProductCard";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";
import type { CategorySummary } from "@/lib/data";

export function ProductBrowser({
  items,
  categories,
  total,
}: {
  items: CardProduct[];
  categories: CategorySummary[];
  total: number;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const { add } = useEstimate();

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[270px_1fr]">
      <BrowserControls
        categories={categories}
        total={total}
        view={view}
        onViewChange={setView}
      />

      <div>
        <p className="mb-5 text-[12.5px] uppercase tracking-[2px] text-white/40">
          Showing {items.length} of {total} products
        </p>

        {items.length === 0 && (
          <div className="glass rounded-[28px] p-14 text-center">
            <p className="font-display text-xl text-white">No products matched your filters</p>
            <p className="mt-2 text-sm text-white/50">
              Try widening the price range or clearing the collection filter.
            </p>
            <Link href="/products" className="btn-gold mt-6 inline-block px-6 py-3 text-sm uppercase">
              Reset filters
            </Link>
          </div>
        )}

        {view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((p) => (
              <div
                key={p.id}
                className="glass lift-card flex flex-col gap-5 rounded-[26px] p-4 sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl ?? ""}
                  alt={p.name}
                  loading="lazy"
                  className="h-32 w-full rounded-[20px] object-cover sm:h-24 sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] uppercase tracking-[2.5px] text-gold/80">
                    {p.categoryName} · {p.sku}
                  </p>
                  <Link href={`/products/${p.slug}`}>
                    <h3 className="mt-1 font-display text-[17px] font-semibold text-white hover:text-gold">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[12.5px] text-white/45">
                    {p.packing} · MOQ {p.moq} · {p.stock} in stock
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11.5px] text-white/35 line-through">
                      {formatINR(Number(p.mrp))}
                    </p>
                    <p className="font-display text-[21px] font-bold text-gold">
                      {formatINR(Number(p.offerPrice))}
                    </p>
                    <p className="text-[11px] text-verde">{p.discountPercent}% off</p>
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
                        mrp: Number(p.mrp),
                        price: Number(p.offerPrice),
                        moq: p.moq,
                      })
                    }
                    className="btn-gold flex items-center gap-2 px-5 py-3 text-[12.5px] uppercase"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
