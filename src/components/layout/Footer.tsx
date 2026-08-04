"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { SITE, waLink } from "@/lib/slug";

const COLS = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Mayilon" },
      { href: "/products", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/dealers", label: "Dealer Program" },
      { href: "/safety", label: "Safety Guide" },
    ],
  },
  {
    title: "Categories",
    links: [
      { href: "/products?category=sky-shots", label: "Sky Shots" },
      { href: "/products?category=rockets", label: "Rockets" },
      { href: "/products?category=flower-pots", label: "Flower Pots" },
      { href: "/products?category=sparklers", label: "Sparklers" },
      { href: "/products?category=gift-boxes", label: "Gift Boxes" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/estimate", label: "Quick Estimate" },
      { href: "/track", label: "Track Estimate" },
      { href: "/contact", label: "Contact Sales" },
      { href: "/admin", label: "Admin Console" },
      { href: "/legal", label: "Policies" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setMsg("Enter a valid email");
      return;
    }
    const res = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setMsg(json.success ? "Subscribed — festival offers incoming ✦" : json.message);
    if (json.success) setEmail("");
  }

  return (
    <footer className="relative mt-32 border-t border-gold/15 bg-black/60 backdrop-blur-xl print:hidden">
      <div className="gold-rule absolute inset-x-0 top-0" />
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.3fr]">
        <div>
          <LogoLockup size={48} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
            Factory-direct premium fireworks from Sivakasi. PESO licensed manufacturing, cinematic
            quality, wholesale pricing and safe nationwide dispatch.
          </p>
          <p className="mt-4 text-sm text-gold/80">{SITE.tagline}</p>
          <div className="mt-5 space-y-1 text-xs text-white/45">
            <p>GSTIN: {SITE.gst}</p>
            <p>Licence: {SITE.license}</p>
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[3px] text-gold">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/55 transition-all duration-400 hover:translate-x-1 hover:text-gold inline-block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[3px] text-gold">
            Festival Newsletter
          </h4>
          <form onSubmit={subscribe} className="space-y-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@email.com"
              className="field"
            />
            <button type="submit" className="btn-gold w-full px-4 py-2.5 text-sm">
              Get Offers
            </button>
            {msg && <p className="text-xs text-gold/80">{msg}</p>}
          </form>
          <div className="mt-6 space-y-2 text-sm text-white/55">
            <a href={`tel:${SITE.phoneRaw}`} className="block hover:text-gold">
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="block hover:text-gold">
              {SITE.email}
            </a>
            <a
              href={waLink("Hi Mayilon Crackers!")}
              target="_blank"
              rel="noreferrer"
              className="block hover:text-verde"
            >
              WhatsApp Sales Desk
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/35 md:flex-row">
          <p>© {new Date().getFullYear()} Mayilon Crackers, Sivakasi. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right">
            As per Supreme Court order, online sale of firecrackers is prohibited. This platform
            accepts estimate enquiries only — orders are confirmed offline through our Sivakasi
            sales desk.
          </p>
        </div>
      </div>
    </footer>
  );
}
