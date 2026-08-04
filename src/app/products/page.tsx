import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { Reveal } from "@/components/ui/Reveal";
import { getCategories, getProducts } from "@/lib/data";
import { SITE } from "@/lib/slug";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = typeof sp.category === "string" ? sp.category : undefined;
  const cats = await getCategories();
  const found = cats.find((c) => c.slug === cat);
  const title = found
    ? `${found.name} — Sivakasi ${found.name} at Factory Price`
    : "All Fireworks Products — Sivakasi Price List";
  return {
    title,
    description: found?.description ?? "Browse the complete Mayilon Crackers catalogue with factory-direct pricing, live stock and instant estimate building.",
    alternates: { canonical: `${SITE.url}/products${cat ? `?category=${cat}` : ""}` },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const num = (k: string) => {
    const v = str(k);
    return v ? Number(v) : undefined;
  };

  const [{ items, total }, categories] = await Promise.all([
    getProducts({
      category: str("category"),
      q: str("q"),
      sort: str("sort"),
      flag: str("flag"),
      min: num("min"),
      max: num("max"),
      limit: 60,
    }),
    getCategories(),
  ]);

  const active = categories.find((c) => c.slug === str("category"));

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: active ? active.name : "All Fireworks Products",
    url: `${SITE.url}/products`,
    numberOfItems: total,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <section className="shell pt-6">
        <nav className="flex items-center gap-2 text-[12px] text-white/40">
          <Link href="/" className="hover:text-gold">
            Home
          </Link>
          <span className="text-gold/50">/</span>
          <Link href="/products" className="hover:text-gold">
            Products
          </Link>
          {active && (
            <>
              <span className="text-gold/50">/</span>
              <span className="text-gold">{active.name}</span>
            </>
          )}
        </nav>

        <Reveal className="relative mt-6 overflow-hidden rounded-[34px] border border-gold/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active?.imageUrl ?? categories[0]?.imageUrl ?? ""}
            alt={active?.name ?? "Fireworks collection"}
            className="h-[280px] w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(5,5,5,0.96),rgba(5,5,5,0.6)_60%,transparent)]" />
          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-9 lg:p-14">
            <span className="text-[11px] uppercase tracking-[4px] text-gold">
              {active?.nameTa ?? "Complete catalogue"} · {total} products
            </span>
            <h1 className="max-w-2xl font-display text-[32px] font-bold leading-tight sm:text-[46px]">
              {active ? (
                <>
                  {active.name} <span className="gold-text">Collection</span>
                </>
              ) : (
                <>
                  Every firework we <span className="gold-text">manufacture</span>
                </>
              )}
            </h1>
            <p className="max-w-xl text-[14px] text-white/55">
              {active?.description ??
                "Factory-direct pricing on the full Mayilon range. Filter by category, price band or collection, then build an estimate in one click."}
            </p>
          </div>
        </Reveal>
      </section>

      <section className="shell py-12">
        <Suspense fallback={<div className="glass h-40 rounded-[28px]" />}>
          <ProductBrowser items={items} categories={categories} total={total} />
        </Suspense>
      </section>
    </>
  );
}
