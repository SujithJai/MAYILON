import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import {
  FAQAccordion,
  Features,
  QuickCalculator,
  ReviewCarousel,
  WhyUs,
} from "@/components/home/Sections";
import { HOME_FAQS } from "@/lib/faqs";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCategories, getFeaturedProducts, getProducts, getReviews } from "@/lib/data";
import { IMAGE_POOL } from "@/lib/seed-data";
import { SITE, waLink } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, reviews, all] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getReviews(6),
    getProducts({ limit: 200, sort: "alpha" }),
  ]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Hero
        images={IMAGE_POOL}
        stats={{ products: all.total, categories: categories.length }}
      />

      <Features />

      {/* Instant Pricing Calculator moved right after Features */}
      <section className="shell py-16">
        <SectionHeading
          eyebrow="Instant Pricing"
          title={
            <>
              Quick <span className="gold-text">Estimate Calculator</span>
            </>
          }
          sub="Search any product, set quantity, watch the factory total calculate instantly. No login required."
        />
        <Reveal>
          <QuickCalculator products={all.items} />
        </Reveal>
      </section>

      {/* Featured Products */}
      <section className="shell py-16">
        <SectionHeading
          align="left"
          eyebrow="Featured"
          title={
            <>
              This Season&apos;s <span className="gold-text">Most Requested</span>
            </>
          }
          sub="Hand-picked by our sales desk based on live estimate volume."
          action={
            <Link href="/products" className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm uppercase">
              View All Products <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} p={p} index={i} />
          ))}
        </div>
      </section>

      {/* Festival banner */}
      <section className="shell py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] border border-red-500/30 bg-slate-950 text-white shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGE_POOL[4]}
              alt="Deepavali festival fireworks"
              loading="lazy"
              className="h-[380px] w-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/90 to-slate-950/95" />
            <div className="absolute inset-0 flex flex-col justify-center gap-5 p-10 lg:p-16">
              <span className="text-[11px] font-bold uppercase tracking-[4px] text-amber-300">
                Deepavali 2026 · Booking Open
              </span>
              <h3 className="max-w-xl font-display text-[32px] font-bold leading-tight !text-white sm:text-[44px]">
                Book Early. <span className="text-amber-300 font-bold underline decoration-amber-400">Pay Factory Rates.</span>
              </h3>
              <p className="max-w-lg text-[15px] text-slate-200 font-medium leading-relaxed">
                Early estimates submitted before the festival rush get priority packing slots,
                guaranteed stock allocation and free transport above ₹50,000.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/estimate" className="btn-gold px-7 py-3.5 text-sm uppercase font-bold">
                  Build My Estimate
                </Link>
                <Link href="/dealers" className="btn-ghost !bg-white/10 !text-white !border-white/40 hover:!bg-white/20 px-7 py-3.5 text-sm uppercase font-bold">
                  Wholesale Enquiry
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Why Us */}
      <section className="shell py-20">
        <SectionHeading
          eyebrow="Why Mayilon"
          title={
            <>
              Three Generations of <span className="gold-text">Sivakasi Craft</span>
            </>
          }
          sub="A short history of how we removed the markup and kept the quality."
        />
        <WhyUs />
      </section>

      {/* Gallery masonry */}
      <section className="shell py-16">
        <SectionHeading
          align="left"
          eyebrow="Gallery"
          title={
            <>
              Inside the <span className="gold-text">Factory & Night Sky</span>
            </>
          }
          sub="Manufacturing floor, quality bench, packing lines and live customer shows."
        />
        <div className="grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-4">
          {IMAGE_POOL.slice(0, 8).map((src, i) => (
            <Reveal
              key={src}
              delay={i * 0.04}
              className={`overflow-hidden rounded-[24px] border border-red-500/15 shadow-sm ${
                i === 0 || i === 5 ? "row-span-2 col-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Mayilon Crackers gallery ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110"
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="shell py-20">
        <SectionHeading
          eyebrow="Customer Stories"
          title={
            <>
              1,284 Families & Dealers <span className="gold-text">Rate Us 4.9</span>
            </>
          }
        />
        <ReviewCarousel reviews={reviews} />
      </section>

      {/* FAQ */}
      <section className="shell py-20">
        <SectionHeading
          eyebrow="Answers"
          title={
            <>
              Frequently Asked <span className="gold-text">Questions</span>
            </>
          }
        />
        <FAQAccordion />
      </section>

      {/* Contact Banner */}
      <section className="shell pb-16">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[36px] p-10 text-center lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.08),transparent_60%)]" />
            <div className="relative">
              <h3 className="font-display text-[30px] font-bold leading-tight text-slate-900 sm:text-[40px]">
                Talk to a Real <span className="gold-text">Sivakasi Sales Desk</span>
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-[14.5px] text-slate-600">
                Bulk orders, temple festivals, weddings or export enquiries — our team responds
                within 30 minutes during business hours.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <a href={`tel:${SITE.phoneRaw}`} className="btn-gold flex items-center gap-2 px-7 py-3.5 text-sm uppercase">
                  <Phone size={16} /> {SITE.phone}
                </a>
                <a
                  href={waLink("Hi Mayilon Crackers, I need a quotation for Deepavali.")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost flex items-center gap-2 px-7 py-3.5 text-sm uppercase"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <Link href="/contact" className="btn-ghost px-7 py-3.5 text-sm uppercase">
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
