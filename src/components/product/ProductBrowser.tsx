"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { BrowserControls } from "./BrowserControls";
import { ProductCard, type CardProduct } from "./ProductCard";
import { PriceListDownloadModal } from "./PriceListDownloadModal";
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
  const [productList, setProductList] = useState<CardProduct[]>(items);
  const [productTotal, setProductTotal] = useState<number>(total);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const { add } = useEstimate();

  // 1. Instant rehydration from client storage (zero flicker on refresh)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const V_KEY = "mayilon_catalog_v2026_clean_v3";
        if (localStorage.getItem(V_KEY) !== "true") {
          localStorage.removeItem("mayilon_permanent_product_order");
          localStorage.removeItem("mayilon_custom_products");
          localStorage.setItem(V_KEY, "true");
        }
      }
      let list = [...items];
      const localProds = typeof window !== "undefined" ? localStorage.getItem("mayilon_custom_products") : null;
      if (localProds) {
        const parsed = JSON.parse(localProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, any>();
          parsed.forEach((p: any) => {
            if (p?.id) map.set(p.id, p);
          });
          list = list.map((item) => {
            const m = map.get(item.id);
            return m
              ? {
                  ...item,
                  offerPrice: String(m.offerPrice),
                  mrp: String(m.mrp),
                  name: m.name || item.name,
                  packing: m.packing || item.packing,
                  stock: m.stock !== undefined ? m.stock : item.stock,
                }
              : item;
          });
        }
      }

      const savedOrder = typeof window !== "undefined" ? localStorage.getItem("mayilon_permanent_product_order") : null;
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        if (Array.isArray(orderIds) && orderIds.length > 0) {
          const map = new Map<string, number>();
          orderIds.forEach((id: string, idx: number) => map.set(id, idx));
          list.sort((a, b) => {
            const pa = map.has(a.id) ? map.get(a.id)! : 99999;
            const pb = map.has(b.id) ? map.get(b.id)! : 99999;
            return pa - pb;
          });
        }
      }
      setProductList(list);
      setProductTotal(total);
    } catch {
      setProductList(items);
      setProductTotal(total);
    }
  }, [items, total]);

  // 2. Real-time background sync (Immediate on mount + every 3.5 seconds)
  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/v1/products?limit=250", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json?.data?.items)) {
          let fresh = json.data.items as CardProduct[];
          try {
            const savedOrder = typeof window !== "undefined" ? localStorage.getItem("mayilon_permanent_product_order") : null;
            if (savedOrder) {
              const orderIds = JSON.parse(savedOrder);
              if (Array.isArray(orderIds) && orderIds.length > 0) {
                const map = new Map<string, number>();
                orderIds.forEach((id: string, idx: number) => map.set(id, idx));
                fresh = [...fresh].sort((a, b) => {
                  const pa = map.has(a.id) ? map.get(a.id)! : map.has(a.sku || "") ? map.get(a.sku || "")! : 99999;
                  const pb = map.has(b.id) ? map.get(b.id)! : map.has(b.sku || "") ? map.get(b.sku || "")! : 99999;
                  return pa - pb;
                });
              }
            }
          } catch {}

          setProductList((prev) => {
            const prevHash = prev.map((p) => `${p.id}:${p.offerPrice}:${p.mrp}:${p.stock}:${p.name}`).join("|");
            const freshHash = fresh.map((p) => `${p.id}:${p.offerPrice}:${p.mrp}:${p.stock}:${p.name}`).join("|");
            return prevHash !== freshHash ? fresh : prev;
          });
          if (typeof json.data.total === "number") {
            setProductTotal(json.data.total);
          }
        }
      } catch {}
    };

    // Run IMMEDIATELY on page load
    void fetchLatest();
    const interval = setInterval(fetchLatest, 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[270px_1fr]">
      <BrowserControls
        categories={categories}
        total={productTotal}
        view={view}
        onViewChange={setView}
      />

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] font-bold uppercase tracking-[2px] text-slate-500">
            Showing {productList.length} of {productTotal} products
          </p>
          <button
            onClick={() => setDownloadOpen(true)}
            className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
          >
            <Download size={14} /> Download Price List (PDF / Excel / Word)
          </button>
        </div>

        <PriceListDownloadModal
          isOpen={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          products={productList}
        />

        {productList.length === 0 && (
          <div className="glass rounded-[28px] p-14 text-center border border-red-500/15 bg-white shadow-md">
            <p className="font-display text-xl font-bold text-slate-900">No products matched your filters</p>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Try widening the price range or clearing the collection filter.
            </p>
            <Link href="/products" className="btn-gold mt-6 inline-block px-6 py-3 text-sm uppercase font-bold">
              Reset Filters
            </Link>
          </div>
        )}

        {view === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {productList.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {productList.map((p) => (
              <div
                key={p.id}
                className="glass lift-card flex flex-col gap-5 rounded-[26px] p-4 border border-red-500/15 bg-white shadow-md sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl ?? ""}
                  alt={p.name}
                  loading="lazy"
                  className="h-32 w-full rounded-[20px] object-cover border border-slate-200 sm:h-24 sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[2.5px] text-red-600">
                    {p.categoryName} · {p.sku}
                  </p>
                  <Link href={`/products/${p.slug}`}>
                    <h3 className="mt-1 font-display text-[17px] font-bold text-slate-900 hover:text-red-600">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-[12.5px] text-slate-500 font-medium">
                    {p.packing} · MOQ {p.moq} · {p.stock} in stock
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11.5px] text-slate-400 line-through">
                      {formatINR(Number(p.mrp))}
                    </p>
                    <p className="font-display text-[21px] font-bold text-red-600">
                      {formatINR(Number(p.offerPrice))}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-600">{p.discountPercent}% off</p>
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
                    className="btn-gold flex h-11 w-11 items-center justify-center rounded-2xl"
                    aria-label={`Add ${p.name} to estimate`}
                  >
                    <Plus size={18} />
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
