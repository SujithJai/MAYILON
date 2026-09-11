"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { BrowserControls } from "./BrowserControls";
import { ProductCard, type CardProduct } from "./ProductCard";
import { PriceListDownloadModal } from "./PriceListDownloadModal";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";
import { resolveCategorySlug } from "@/lib/slug";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";

  // 1. Instant rehydration from client storage (zero flicker on refresh)
  useEffect(() => {
    try {
      let list = [...items];
      const localProds = typeof window !== "undefined" ? localStorage.getItem("mayilon_custom_products") : null;
      if (localProds) {
        const parsed = JSON.parse(localProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, any>();
          parsed.forEach((p: any) => {
            if (p?.id) map.set(p.id, p);
          });

          // 1a. Update existing products with local price/stock edits
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

          // 1b. Merge any custom added products that are not yet in SSR items
          const existingIds = new Set(list.map((it) => it.id));
          const existingSkus = new Set(list.map((it) => it.sku));
          const currentSp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
          const activeCat = currentSp.get("category");

          for (const p of parsed) {
            if (!p || !p.id) continue;
            if (existingIds.has(p.id) || (p.sku && existingSkus.has(p.sku))) continue;

            const pSlug = resolveCategorySlug(p.categoryName);
            if (activeCat && activeCat !== "all") {
              const activeSlug = resolveCategorySlug(activeCat);
              if (pSlug !== activeSlug && p.categorySlug !== activeCat) continue;
            }

            const mrpNum = Number(p.mrp) || 100;
            const offerNum = Number(p.offerPrice) || mrpNum;
            const cat = categories.find((c) => c.slug === pSlug);

            list.push({
              id: p.id,
              sku: p.sku || "MYL-PROD",
              slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              name: p.name,
              nameTa: p.nameTa || null,
              categoryName: p.categoryName || cat?.name || "Special Fireworks",
              categorySlug: pSlug,
              categoryAccent: cat?.accent || "#D4AF37",
              packing: p.packing || "1 Box",
              mrp: mrpNum.toFixed(2),
              offerPrice: offerNum.toFixed(2),
              discountPercent: p.discountPercent || Math.round(((mrpNum - offerNum) / mrpNum) * 100),
              stock: p.stock !== undefined ? p.stock : 500,
              moq: p.moq || 1,
              imageUrl: p.imageUrl || "/images/placeholder.jpg",
              gallery: [p.imageUrl || "/images/placeholder.jpg"],
              isNewArrival: Boolean(p.isNewArrival),
              isBestSeller: Boolean(p.isBestSeller),
              isPremium: Boolean(p.isPremium),
              rating: "4.8",
              reviewCount: 20,
            } as CardProduct);
          }
        }
      }

      // 1c. Sort by permanent sequence
      const savedOrder = typeof window !== "undefined" ? localStorage.getItem("mayilon_permanent_product_order") : null;
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        if (Array.isArray(orderIds) && orderIds.length > 0) {
          const map = new Map<string, number>();
          orderIds.forEach((id: string, idx: number) => map.set(id, idx));
          list.sort((a, b) => {
            const pa = map.has(a.id) ? map.get(a.id)! : map.has(a.sku || "") ? map.get(a.sku || "")! : 99999;
            const pb = map.has(b.id) ? map.get(b.id)! : map.has(b.sku || "") ? map.get(b.sku || "")! : 99999;
            return pa - pb;
          });
        }
      }
      setProductList(list);
      setProductTotal(list.length);
    } catch {
      setProductList(items);
      setProductTotal(total);
    }
  }, [items, total, categories]);

  // 2. Real-time background sync (Passes active URL query so category filters are NEVER wiped out!)
  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const search = typeof window !== "undefined" ? window.location.search : "";
        const sp = new URLSearchParams(search);
        if (!sp.has("limit")) sp.set("limit", "350");
        const res = await fetch(`/api/v1/products?${sp.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json?.data?.items)) {
          let fresh = json.data.items as CardProduct[];

          // Merge local custom products that are not yet in server response
          try {
            const localRaw = typeof window !== "undefined" ? localStorage.getItem("mayilon_custom_products") : null;
            if (localRaw) {
              const localProds = JSON.parse(localRaw);
              if (Array.isArray(localProds) && localProds.length > 0) {
                const freshIds = new Set(fresh.map((p) => p.id));
                const freshSkus = new Set(fresh.map((p) => p.sku));
                const activeCat = sp.get("category");

                for (const lp of localProds) {
                  if (!lp || !lp.id) continue;
                  if (freshIds.has(lp.id) || (lp.sku && freshSkus.has(lp.sku))) continue;

                  const lpSlug = resolveCategorySlug(lp.categoryName);
                  if (activeCat && activeCat !== "all") {
                    const activeSlug = resolveCategorySlug(activeCat);
                    if (lpSlug !== activeSlug && lp.categorySlug !== activeCat) continue;
                  }

                  fresh.push({
                    id: lp.id,
                    sku: lp.sku || "MYL-PROD",
                    slug: lp.slug || lp.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    name: lp.name,
                    nameTa: lp.nameTa || null,
                    categoryName: lp.categoryName || "Special Fireworks",
                    categorySlug: lpSlug,
                    categoryAccent: "#D4AF37",
                    packing: lp.packing || "1 Box",
                    mrp: String(lp.mrp || 100),
                    offerPrice: String(lp.offerPrice || lp.mrp || 100),
                    discountPercent: lp.discountPercent || 80,
                    stock: lp.stock !== undefined ? lp.stock : 500,
                    moq: lp.moq || 1,
                    imageUrl: lp.imageUrl || "/images/placeholder.jpg",
                    gallery: [lp.imageUrl || "/images/placeholder.jpg"],
                    isNewArrival: Boolean(lp.isNewArrival),
                    isBestSeller: Boolean(lp.isBestSeller),
                    isPremium: Boolean(lp.isPremium),
                    rating: "4.8",
                    reviewCount: 20,
                  } as CardProduct);
                }
              }
            }
          } catch {}

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
            setProductTotal(Math.max(json.data.total, fresh.length));
          }
        }
      } catch {}
    };

    void fetchLatest();
    const interval = setInterval(fetchLatest, 4000);

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

      <div id="products-grid">
        {/* Quick Category Navigation Bar for smooth scrolling and 1-tap filtering */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href="/products"
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
              activeCategory === "all"
                ? "bg-red-600 text-white shadow-red-600/30"
                : "border border-slate-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50"
            }`}
          >
            All Categories ({total})
          </Link>
          {categories.map((c) => {
            const isActive = activeCategory === c.slug;
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
                  isActive
                    ? "bg-red-600 text-white shadow-red-600/30"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50"
                }`}
              >
                {c.name} ({c.productCount})
              </Link>
            );
          })}
        </div>

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
