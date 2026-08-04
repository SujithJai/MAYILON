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
        <nav className="flex flex-wrap items-center gap-2 text-[12px] text-white/40">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="text-gold/50">/</span>
          <Link href="/products" className="hover:text-gold">Products</Link>
          <span className="text-gold/50">/</span>
          <Link href={`/products?category=${p.categorySlug}`} className="hover:text-gold">
            {p.categoryName}
          </Link>
          <span className="text-gold/50">/</span>
          <span className="text-gold">{p.name}</span>
        </nav>
      </section>

      <section className="shell grid gap-10 py-10 lg:grid-cols-[1fr_460px]">
        <Reveal>
          <ProductGallery images={p.gallery?.length ? p.gallery : [p.imageUrl ?? ""]} name={p.name} />
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.05}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[10.5px] uppercase tracking-[2px]"
                  style={{
                    color: p.categoryAccent,
                    background: `${p.categoryAccent}1a`,
                    border: `1px solid ${p.categoryAccent}55`,
                  }}
                >
                  {p.categoryName}
                </span>
                {p.isBestSeller && (
                  <span className="rounded-full bg-ember/15 px-3 py-1 text-[10.5px] uppercase tracking-[2px] text-ember">
                    Best Seller
                  </span>
                )}
                {p.isPremium && (
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-[10.5px] uppercase tracking-[2px] text-gold">
                    Premium
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-display text-[32px] font-bold leading-tight sm:text-[40px]">
                {p.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-white/50">
                <span className="flex items-center gap-1.5 text-gold">
                  <Star size={14} fill="currentColor" /> {Number(p.rating).toFixed(1)}
                  <span className="text-white/40">({p.reviewCount} reviews)</span>
                </span>
                <span className="text-white/25">|</span>
                <span className="uppercase tracking-[2px]">{p.sku}</span>
                <span className="text-white/25">|</span>
                <span className={p.stock > 60 ? "text-verde" : "text-flame"}>
                  {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                </span>
              </div>

              <p className="mt-5 text-[14.5px] leading-relaxed text-white/60">
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
            <div className="glass rounded-[26px] border-ember/25 p-6">
              <div className="flex items-center gap-2 text-ember">
                <ShieldAlert size={17} />
                <h3 className="font-display text-[15px] font-semibold">Safety information</h3>
              </div>
              <ul className="mt-3 space-y-2 text-[13px] text-white/55">
                <li>• Always use outdoors in an open area, minimum 10 metres from buildings.</li>
                <li>• Adult supervision mandatory. Keep a bucket of water/sand nearby.</li>
                <li>• Never relight a dud. Wait 5 minutes, then soak in water.</li>
                <li>• Store away from heat sources, in original sealed packaging.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Specifications + description */}
      <section className="shell grid gap-8 py-12 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full rounded-[30px] p-8">
            <h3 className="font-display text-xl font-semibold text-white">Specifications</h3>
            <dl className="mt-5 divide-y divide-white/6">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-2.5 text-[13.5px]">
                  <dt className="text-white/45">{k}</dt>
                  <dd className="text-right text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="space-y-8">
            <div className="glass rounded-[30px] p-8">
              <h3 className="font-display text-xl font-semibold text-white">Product description</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-white/60">{p.description}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: PackageCheck, t: "Sealed packing", d: "Moisture barrier carton" },
                  { icon: Truck, t: "48h dispatch", d: "Licensed transporters" },
                  { icon: CheckCircle2, t: "Batch tested", d: "In-house QC bench" },
                  { icon: ShieldAlert, t: "PESO compliant", d: "Licensed manufacture" },
                ].map((b) => (
                  <div key={b.t} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                    <b.icon size={16} className="text-gold" />
                    <p className="mt-2 text-[13px] font-medium text-white">{b.t}</p>
                    <p className="text-[11.5px] text-white/40">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[30px] p-8">
              <h3 className="font-display text-xl font-semibold text-white">Delivery timeline</h3>
              <div className="mt-5 space-y-4">
                {TIMELINE.map((s, i) => (
                  <div key={s.t} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 bg-gold/10 text-[11px] font-bold text-gold">
                        {i + 1}
                      </span>
                      {i < TIMELINE.length - 1 && <span className="mt-1 h-full w-px bg-gold/25" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-[14px] font-medium text-white">{s.t}</p>
                      <p className="text-[12.5px] text-white/45">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Reviews */}
      <section className="shell py-12">
        <SectionHeading
          align="left"
          eyebrow="Verified reviews"
          title={
            <>
              What buyers say about <span className="gold-text">{p.categoryName}</span>
            </>
          }
        />
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06}>
              <div className="glass h-full rounded-[26px] p-6">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star
                      key={k}
                      size={13}
                      className={k < r.rating ? "text-gold" : "text-white/15"}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="mt-3 font-display text-[15px] font-semibold text-white">{r.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{r.body}</p>
                <p className="mt-4 text-[12px] text-gold">
                  {r.name} · <span className="text-white/35">{r.location}</span>
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="shell py-12">
        <SectionHeading
          align="left"
          eyebrow="Frequently bought together"
          title={
            <>
              More from <span className="gold-text">{p.categoryName}</span>
            </>
          }
          action={
            <Link
              href={`/products?category=${p.categorySlug}`}
              className="btn-ghost px-6 py-3 text-sm uppercase"
            >
              View category
            </Link>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r, i) => (
            <ProductCard key={r.id} p={r} index={i} />
          ))}
        </div>
      </section>

      <section className="shell pb-16">
        <div className="glass rounded-[30px] p-7 text-center text-[13px] text-white/50">
          Estimated value for {p.moq} × {p.name}:{" "}
          <span className="text-gold">{formatINR(price * p.moq)}</span> — final invoice is confirmed
          by our sales desk after stock verification.
        </div>
      </section>
    </>
  );
}
