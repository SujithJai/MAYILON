import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageCheck, ShieldAlert, Star, Truck } from "lucide-react";
import { EstimateWidget } from "@/components/product/EstimateWidget";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProductBySlug, getRelatedProducts, getReviews } from "@/lib/data";
import { formatINR } from "@/lib/estimate";
import { SITE } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: `${p.name} — ${p.discountPercent}% Off | ${p.categoryName}`,
    description: p.shortDescription ?? undefined,
    alternates: { canonical: `${SITE.url}/products/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.shortDescription ?? "",
      images: p.imageUrl ? [p.imageUrl] : [],
      type: "website",
    },
  };
}

const TIMELINE = [
  { t: "Estimate", d: "Submitted online, reference generated instantly" },
  { t: "Confirmation", d: "Sales desk verifies stock & pricing within 24h" },
  { t: "Packing", d: "Double-layer carton packing with QR batch label" },
  { t: "Dispatch", d: "Licensed transporter, LR number shared on WhatsApp" },
  { t: "Delivery", d: "2–6 days depending on destination state" },
];

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(p.categoryId, p.id, 4),
    getReviews(3),
  ]);

  const price = Number(p.offerPrice);
  const mrp = Number(p.mrp);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        image: p.gallery?.length ? p.gallery : [p.imageUrl],
        description: p.description,
        sku: p.sku,
        brand: { "@type": "Brand", name: SITE.name },
        category: p.categoryName,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(p.rating).toFixed(1),
          reviewCount: p.reviewCount,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: price.toFixed(2),
          availability:
            p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${SITE.url}/products/${p.slug}`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Products", item: `${SITE.url}/products` },
          {
            "@type": "ListItem",
            position: 3,
            name: p.categoryName,
            item: `${SITE.url}/products?category=${p.categorySlug}`,
          },
          { "@type": "ListItem", position: 4, name: p.name },
        ],
      },
    ],
  };

  const specs: [string, string][] = [
    ["SKU / Product code", p.sku],
    ["Category", p.categoryName],
    ["Brand", SITE.name],
    ["Packing", p.packing],
    ["Pieces per pack", String(p.piecesPerPack)],
    ["Burn time", p.burnTime],
    ["Sound level", p.soundLevel],
    ["Light / colour effect", (p.effectColors ?? []).join(", ") || "Multi-colour"],
    ["Age recommendation", p.ageRecommendation],
    ["Usage", p.usage],
    ["Minimum order qty", String(p.moq)],
    ["GST", `${p.gstPercent}%`],
    ["Storage", "Cool, dry place away from heat & direct sunlight"],
    ["Manufacturer", "Mayilon Crackers, Sivakasi, Tamil Nadu"],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="shell pt-6">
        <nav className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-slate-500">
          <Link href="/" className="hover:text-red-600 transition">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/products" className="hover:text-red-600 transition">Products</Link>
          <span className="text-slate-300">/</span>
          <Link href={`/products?category=${p.categorySlug}`} className="hover:text-red-600 transition">
            {p.categoryName}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-red-600 font-bold truncate max-w-[200px] sm:max-w-none">{p.name}</span>
        </nav>
      </section>

      <section className="shell grid gap-8 lg:gap-12 py-8 lg:py-10 lg:grid-cols-[1fr_480px] items-start">
        <Reveal>
          <ProductGallery
            images={
              p.gallery?.length
                ? p.gallery
                : [p.imageUrl, (p as any).imageUrl2, (p as any).imageUrl3].filter(Boolean) as string[]
            }
            videoUrl={(p as any).videoUrl}
            name={p.name}
          />
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.05}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[2px]"
                  style={{
                    color: p.categoryAccent || "#dc2626",
                    background: `${p.categoryAccent || "#dc2626"}15`,
                    border: `1px solid ${p.categoryAccent || "#dc2626"}40`,
                  }}
                >
                  {p.categoryName}
                </span>
                {p.isBestSeller && (
                  <span className="rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[2px] text-orange-700">
                    Best Seller
                  </span>
                )}
                {p.isPremium && (
                  <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[2px] text-amber-700">
                    Premium
                  </span>
                )}
              </div>

              <h1 className="mt-3.5 font-display text-[28px] sm:text-[38px] font-bold leading-tight text-slate-900">
                {p.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <Star size={15} fill="currentColor" /> {Number(p.rating).toFixed(1)}
                  <span className="text-slate-500 font-normal">({p.reviewCount} reviews)</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="uppercase tracking-[2px] font-mono font-bold text-slate-700">{p.sku}</span>
                <span className="text-slate-300">|</span>
                <span className={`font-bold ${p.stock > 60 ? "text-emerald-600" : "text-amber-600"}`}>
                  {p.stock > 0 ? `${p.stock} units available` : "Out of stock"}
                </span>
              </div>

              <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600 font-medium">
                {p.shortDescription}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <EstimateWidget
              p={{
                id: p.id,
                sku: p.sku,
                slug: p.slug,
                name: p.name,
                categoryName: p.categoryName,
                packing: p.packing,
                imageUrl: p.imageUrl,
                mrp,
                price,
                dealerPrice: p.dealerPrice ? Number(p.dealerPrice) : null,
                moq: p.moq,
                stock: p.stock,
                discountPercent: p.discountPercent,
              }}
            />
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass rounded-[24px] border-red-500/20 p-5 bg-red-50/60 shadow-sm">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert size={18} />
                <h3 className="font-display text-[15px] font-bold">Safety Instructions</h3>
              </div>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-700 font-medium">
                <li>• Always light outdoors in open clear ground, minimum 10 metres away.</li>
                <li>• Strict adult supervision required for kids. Keep water/sand bucket nearby.</li>
                <li>• Do not re-ignite a failed cracker. Wait 5 minutes and douse in water.</li>
                <li>• Store in a cool dry place inside original factory carton.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Specifications + description */}
      <section className="shell grid gap-8 py-10 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full rounded-[28px] p-6 sm:p-8 bg-white border border-red-500/15 shadow-md">
            <h3 className="font-display text-xl font-bold text-slate-900">Specifications</h3>
            <dl className="mt-5 divide-y divide-slate-100">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3 text-[13.5px]">
                  <dt className="text-slate-500 font-medium">{k}</dt>
                  <dd className="text-right text-slate-900 font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-8">
            <div className="glass rounded-[28px] p-6 sm:p-8 bg-white border border-red-500/15 shadow-md">
              <h3 className="font-display text-xl font-bold text-slate-900">Product Description</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-slate-600 font-medium">{p.description}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: PackageCheck, t: "Sealed packing", d: "Moisture barrier carton" },
                  { icon: Truck, t: "48h dispatch", d: "Licensed transporters" },
                  { icon: CheckCircle2, t: "Batch tested", d: "In-house QC bench" },
                  { icon: ShieldAlert, t: "PESO compliant", d: "Licensed manufacture" },
                ].map((b) => (
                  <div key={b.t} className="rounded-2xl border border-red-500/15 bg-red-50/40 p-4">
                    <b.icon size={18} className="text-red-600" />
                    <p className="mt-2 text-[13px] font-bold text-slate-900">{b.t}</p>
                    <p className="text-[11.5px] text-slate-500 font-medium">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[28px] p-6 sm:p-8 bg-white border border-red-500/15 shadow-md">
              <h3 className="font-display text-xl font-bold text-slate-900">Delivery Timeline</h3>
              <div className="mt-5 space-y-4">
                {TIMELINE.map((s, i) => (
                  <div key={s.t} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/30 bg-red-50 text-[11px] font-bold text-red-600">
                        {i + 1}
                      </span>
                      {i < TIMELINE.length - 1 && <span className="mt-1 h-full w-px bg-red-200" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-[14px] font-bold text-slate-900">{s.t}</p>
                      <p className="text-[12.5px] text-slate-500 font-medium">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Reviews */}
      <section className="shell py-10">
        <SectionHeading
          align="left"
          eyebrow="Verified Reviews"
          title={
            <>
              What Buyers Say About <span className="gold-text">{p.categoryName}</span>
            </>
          }
        />
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06}>
              <div className="glass h-full rounded-[26px] p-6 bg-white border border-red-500/15 shadow-md">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star
                      key={k}
                      size={14}
                      className={k < r.rating ? "text-amber-500" : "text-slate-200"}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="mt-3 font-display text-[15px] font-bold text-slate-900">{r.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600 font-medium">{r.body}</p>
                <p className="mt-4 text-[12px] font-bold text-red-600">
                  {r.name} · <span className="text-slate-400 font-normal">{r.location}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="shell py-10">
        <SectionHeading
          align="left"
          eyebrow="Frequently Bought Together"
          title={
            <>
              More From <span className="gold-text">{p.categoryName}</span>
            </>
          }
          action={
            <Link
              href={`/products?category=${p.categorySlug}`}
              className="btn-ghost px-6 py-3 text-sm uppercase font-bold"
            >
              View Category
            </Link>
          }
        />
        <div className="grid gap-3.5 sm:gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {related.map((r, i) => (
            <ProductCard key={r.id} p={r} index={i} />
          ))}
        </div>
      </section>

      <section className="shell pb-16">
        <div className="glass rounded-[28px] p-6 text-center text-[13.5px] text-slate-600 font-medium bg-white border border-red-500/15 shadow-md">
          Estimated value for {p.moq} × {p.name}:{" "}
          <span className="text-red-600 font-bold">{formatINR(price * p.moq)}</span> — final invoice is confirmed
          by our Sivakasi sales desk upon order submission.
        </div>
      </section>
    </>
  );
}
