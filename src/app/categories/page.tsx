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
      <nav className="flex items-center gap-2 text-[12.5px] font-medium text-slate-500">
        <Link href="/" className="hover:text-red-600 transition">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-red-600 font-bold">Categories</span>
      </nav>

      <div className="mt-8">
        <SectionHeading
          align="left"
          eyebrow={`${categories.length} collections · ${totalProducts} products`}
          title={
            <>
              The Complete <span className="gold-text">Mayilon Universe</span>
            </>
          }
          sub="Every category is manufactured in our own Sivakasi facility, batch tested on our QC bench and packed for safe nationwide transport."
        />
        <CategoryGrid categories={categories} />
      </div>

      <div className="glass mt-16 rounded-[28px] p-8 sm:p-12 text-center bg-white border border-red-500/20 shadow-md">
        <h3 className="font-display text-[26px] sm:text-[32px] font-bold text-slate-900">
          Need a <span className="gold-text">Custom Festival Pack?</span>
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-[14.5px] text-slate-600 font-medium">
          Tell us your budget and family count — our team curates a custom mix across categories and sends a
          ready-to-approve estimate within 2 hours.
        </p>
        <Link href="/contact" className="btn-gold mt-7 inline-block px-8 py-3.5 text-sm uppercase font-bold tracking-wider">
          Request Custom Pack
        </Link>
      </div>
    </div>
  );
}
