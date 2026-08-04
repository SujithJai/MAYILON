"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone, Receipt } from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { formatINR } from "@/lib/estimate";
import { SITE, waLink } from "@/lib/slug";

export function MobileDock() {
  const pathname = usePathname();
  const { items, totals } = useEstimate();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div className="glass-dark fixed inset-x-3 bottom-3 z-[280] flex items-center gap-2 rounded-2xl p-2 md:hidden print:hidden">
        <a
          href={`tel:${SITE.phoneRaw}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/25 py-2.5 text-xs text-white/80"
        >
          <Phone size={15} className="text-gold" /> Call
        </a>
        <a
          href={waLink("Hi Mayilon Crackers, I need a quotation.")}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-verde/30 py-2.5 text-xs text-white/80"
        >
          <MessageCircle size={15} className="text-verde" /> WhatsApp
        </a>
        <Link href="/estimate" className="btn-gold flex flex-[1.4] items-center justify-center gap-2 py-2.5 text-xs">
          <Receipt size={15} />
          {items.length ? formatINR(totals.subtotal, { compact: true }) : "Estimate"}
        </Link>
      </div>

      <a
        href={waLink("Hi Mayilon Crackers, I would like the latest price list.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-8 left-6 z-[280] hidden h-13 w-13 items-center justify-center rounded-full border border-verde/40 bg-verde/15 p-3.5 text-verde shadow-[0_0_30px_-6px_rgba(0,210,106,0.8)] backdrop-blur-xl transition-all duration-500 hover:scale-110 hover:bg-verde/25 md:flex"
      >
        <MessageCircle size={22} />
      </a>
    </>
  );
}
