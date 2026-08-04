import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Policies — Privacy, Terms, Shipping, Refund & Disclaimer",
  description:
    "Mayilon Crackers legal policies covering privacy, terms of use, shipping and dispatch, refunds and the statutory fireworks disclaimer.",
  alternates: { canonical: `${SITE.url}/legal` },
};

const SECTIONS = [
  {
    id: "disclaimer",
    t: "Statutory disclaimer",
    b: [
      "As per the Supreme Court of India order dated 12.09.2017 and subsequent directions, e-commerce platforms are prohibited from accepting online sale orders for firecrackers. Mayilon Crackers therefore operates an estimate-request model only.",
      "Nothing on this website constitutes an offer for sale. Submitting an estimate creates an enquiry record. All sales are concluded offline at our licensed Sivakasi premises, subject to statutory compliance and applicable state regulations.",
    ],
  },
  {
    id: "privacy",
    t: "Privacy policy",
    b: [
      "We collect only the data required to process your estimate: name, mobile number, email, delivery address and transport preference. Mobile numbers are verified through a one-time password.",
      "Data is stored in encrypted PostgreSQL infrastructure, is never sold to third parties, and is shared only with the transport partner you select for the purpose of dispatch.",
      "You may request deletion of your data at any time by writing to " + SITE.email + ". Audit records required by law are retained for 365 days.",
    ],
  },
  {
    id: "terms",
    t: "Terms of use",
    b: [
      "Products are sold for lawful, outdoor, adult-supervised use only. Buyers must comply with all state and municipal restrictions including silent zones and permitted timings.",
      "Prices are valid for 7 days from the estimate date and are subject to stock confirmation. Printed MRP is set by the manufacturer; our offer price reflects factory-direct supply.",
      "Minimum order values: ₹3,000 for Tamil Nadu and Puducherry, ₹5,000 for other states.",
    ],
  },
  {
    id: "shipping",
    t: "Shipping & dispatch",
    b: [
      "Goods are dispatched only through PESO-registered transporters holding explosives movement authorisation. Air and standard courier movement is not permitted for fireworks.",
      "Dispatch typically occurs within 48 hours of order confirmation. Delivery takes 2–6 working days depending on destination state.",
      "Transport charges shown in an estimate are indicative. Actual freight is billed at cost by the transporter, and is free on confirmed orders above ₹50,000.",
    ],
  },
  {
    id: "refund",
    t: "Refund & damage policy",
    b: [
      "Claims for transit damage or short supply must be raised within 24 hours of delivery with photographic and video evidence of the sealed carton being opened.",
      "Approved claims are settled as replacement stock in the next dispatch or as credit against the following order. Cash refunds are issued only where replacement is not possible.",
      "Fireworks that have been exposed to moisture after delivery, or used contrary to the safety guidance, are not eligible for claims.",
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">Policies</span>
      </nav>

      <h1 className="mt-10 font-display text-[36px] font-bold leading-tight sm:text-[46px]">
        Policies & <span className="gold-text">compliance</span>
      </h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-gold/25 px-4 py-2 text-[12px] text-white/60 transition hover:border-gold hover:text-gold"
          >
            {s.t}
          </a>
        ))}
      </div>

      <div className="mt-10 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="glass scroll-mt-32 rounded-[30px] p-8">
            <h2 className="font-display text-[22px] font-semibold text-gold">{s.t}</h2>
            <div className="mt-4 space-y-3.5 text-[14px] leading-relaxed text-white/60">
              {s.b.map((p) => (
                <p key={p.slice(0, 30)}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-[12.5px] text-white/35">
        Last updated {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} · {SITE.name},{" "}
        {SITE.license}
      </p>
    </div>
  );
}
