import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import {
  CategoryGrid,
  FAQAccordion,
  Features,
  QuickCalculator,
  ReviewCarousel,
  StatStrip,
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
    getProducts({ limit: 12, sort: "best" }),
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

      <section className="shell -mt-6">
        <Reveal>
          <StatStrip />
        </Reveal>
      </section>

      <Features />

      <section className="shell py-24">
        <SectionHeading
          eyebrow="Collections"
          title={
            <>
              Ten curated <span className="gold-text">fireworks worlds</span>
            </>
          }
          sub="From show-grade aerial repeaters to child-safe sparklers — every category is manufactured, tested and packed at our own Sivakasi facility."
        />
        <CategoryGrid categories={categories} />
      </section>

      <section className="shell py-16">
        <SectionHeading
          align="left"
          eyebrow="Featured"
          title={
            <>
              This season&apos;s <span className="gold-text">most requested</span>
            </>
          }
          sub="Hand-picked by our sales desk based on live estimate volume."
          action={
            <Link href="/products" className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm uppercase">
              View all products <ArrowRight size={15} />
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
          <div className="relative overflow-hidden rounded-[36px] border border-gold/25">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGE_POOL[4]}
              alt="Deepavali festival fireworks"
              loading="lazy"
              className="h-[380px] w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,5,0.95),rgba(5,5,5,0.55)_58%,transparent)]" />
            <div className="absolute inset-0 flex flex-col justify-center gap-5 p-10 lg:p-16">
              <span className="text-[11px] uppercase tracking-[4px] text-gold">
                Deepavali 2026 · Booking open
              </span>
              <h3 className="max-w-xl font-display text-[32px] font-bold leading-tight sm:text-[44px]">
                Book early. <span className="gold-text">Pay factory rates.</span>
              </h3>
              <p className="max-w-lg text-[14.5px] text-white/60">
                Early estimates submitted before the festival rush get priority packing slots,
                guaranteed stock allocation and free transport above ₹50,000.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/estimate" className="btn-gold px-7 py-3.5 text-sm uppercase">
                  Build my estimate
                </Link>
                <Link href="/dealers" className="btn-ghost px-7 py-3.5 text-sm uppercase">
                  Wholesale enquiry
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="shell py-24">
        <SectionHeading
          eyebrow="Why Mayilon"
          title={
            <>
              Three generations of <span className="gold-text">Sivakasi craft</span>
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
              Inside the <span className="gold-text">factory & the night sky</span>
            </>
          }
          sub="Manufacturing floor, quality bench, packing lines and live customer shows."
        />
        <div className="grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-4">
          {IMAGE_POOL.slice(0, 8).map((src, i) => (
            <Reveal
              key={src}
              delay={i * 0.04}
              className={`overflow-hidden rounded-[24px] border border-gold/15 ${
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

      <section className="shell py-24">
        <SectionHeading
          eyebrow="Customer stories"
          title={
            <>
              1,284 families & dealers <span className="gold-text">rate us 4.9</span>
            </>
          }
        />
        <ReviewCarousel reviews={reviews} />
      </section>

      <section className="shell py-16">
        <SectionHeading
          eyebrow="Instant pricing"
          title={
            <>
              Quick <span className="gold-text">estimate calculator</span>
            </>
          }
          sub="Search a product, set quantity, watch the total move. No login needed until you submit."
        />
        <Reveal>
          <QuickCalculator products={all.items} />
        </Reveal>
      </section>

      <section className="shell py-24">
        <SectionHeading
          eyebrow="Answers"
          title={
            <>
              Frequently asked <span className="gold-text">questions</span>
            </>
          }
        />
        <FAQAccordion />
      </section>

      <section className="shell pb-10">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[36px] p-10 text-center lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.18),transparent_60%)]" />
            <div className="relative">
              <h3 className="font-display text-[30px] font-bold leading-tight sm:text-[40px]">
                Talk to a real <span className="gold-text">Sivakasi sales desk</span>
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-[14.5px] text-white/55">
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
                  Request a quote
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
