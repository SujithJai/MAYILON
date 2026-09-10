"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Download, MessageCircle, Phone, Receipt } from "lucide-react";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { PriceListDownloadModal } from "@/components/product/PriceListDownloadModal";
import { formatINR } from "@/lib/estimate";
import { SITE, waLink } from "@/lib/slug";

export function MobileDock() {
  const pathname = usePathname();
  const { items, totals } = useEstimate();
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div className="glass-dark fixed inset-x-2.5 bottom-2.5 z-[280] flex items-center gap-1.5 rounded-2xl p-1.5 md:hidden print:hidden shadow-2xl border border-red-500/20 bg-slate-950/95 backdrop-blur-xl">
        <button
          onClick={() => setDownloadModalOpen(true)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-600/90 py-2.5 text-[11px] font-extrabold text-white shadow-sm active:scale-95 transition"
        >
          <Download size={13} /> Price List
        </button>
        <a
          href={waLink("Hi Mayilon Crackers, I need a quotation.")}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-600/90 py-2.5 text-[11px] font-extrabold text-white shadow-sm active:scale-95 transition"
        >
          <MessageCircle size={13} /> WhatsApp
        </a>
        <Link
          href="/estimate"
          className="btn-gold flex flex-[1.2] items-center justify-center gap-1 py-2.5 text-[11px] font-extrabold active:scale-95 transition"
        >
          <Receipt size={13} />
          <span>{items.length ? formatINR(totals.subtotal, { compact: true }) : "Estimate"}</span>
          {items.length > 0 && (
            <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.2 text-[9.5px] font-black text-white">
              {items.length}
            </span>
          )}
        </Link>
      </div>

      <PriceListDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

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
