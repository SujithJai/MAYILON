"use client";

import { Download, MessageCircle, Printer, Share2 } from "lucide-react";
import { SITE, waLink } from "@/lib/slug";

export function EstimateActions({
  estimateNumber,
  total,
  items,
}: {
  estimateNumber: string;
  total: string;
  items: number;
}) {
  const text = `Mayilon Crackers estimate ${estimateNumber}\n${items} products · Total ${total}\nPlease confirm availability and dispatch.`;

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button onClick={() => window.print()} className="btn-gold flex items-center gap-2 px-6 py-3 text-[13px] uppercase">
        <Download size={15} /> Download PDF
      </button>
      <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2 px-6 py-3 text-[13px] uppercase">
        <Printer size={15} /> Print
      </button>
      <a
        href={waLink(text)}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost flex items-center gap-2 px-6 py-3 text-[13px] uppercase"
      >
        <MessageCircle size={15} /> Send on WhatsApp
      </a>
      <a
        href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Estimate ${estimateNumber}`)}&body=${encodeURIComponent(text)}`}
        className="btn-ghost flex items-center gap-2 px-6 py-3 text-[13px] uppercase"
      >
        <Share2 size={15} /> Email copy
      </a>
    </div>
  );
}
