import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid } from "@/components/home/Sections";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCategories } from "@/lib/data";
import { SITE } from "@/lib/slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fireworks Categories — Sky Shots, Rockets, Sparklers & More",
  description:
    "Explore all 10 Mayilon Crackers categories — aerial sky shots, rockets, flower pots, ground chakkar, sparklers, novelty, sound crackers, gift boxes, kids specials and wedding pyrotechnics.",
  alternates: { canonical: `${SITE.url}/categories` },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const totalProducts = categories.reduce((s, c) => s + c.productCount, 0);

  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">Categories</span>
      </nav>

      <div className="mt-10">
        <SectionHeading
          align="left"
          eyebrow={`${categories.length} collections · ${totalProducts} products`}
          title={
            <>
              The complete <span className="gold-text">Mayilon universe</span>
            </>
          }
          sub="Every category is manufactured in our own Sivakasi facility, batch tested on our QC bench and packed for safe nationwide transport."
        />
        <CategoryGrid categories={categories} />
      </div>

      <div className="glass mt-16 rounded-[30px] p-10 text-center">
        <h3 className="font-display text-[26px] font-bold text-white">
          Need a <span className="gold-text">custom festival pack?</span>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-[14px] text-white/55">
          Tell us your budget and guest count — our team curates a mix across categories and sends a
          ready-to-approve estimate within 4 hours.
        </p>
        <Link href="/contact" className="btn-gold mt-7 inline-block px-8 py-3.5 text-sm uppercase">
          Request custom pack
        </Link>
      </div>
    </div>
  );
}
