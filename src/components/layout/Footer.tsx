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
    <footer className="relative mt-24 border-t border-red-500/20 bg-slate-950 text-slate-300 print:hidden">
      <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-amber-500" />
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.3fr]">
        <div>
          <LogoLockup size={48} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
            Factory-direct premium fireworks from Sivakasi. PESO licensed manufacturing, cinematic
            quality, wholesale pricing and safe nationwide dispatch.
          </p>
          <p className="mt-4 text-sm font-bold text-red-400">{SITE.tagline}</p>
          <div className="mt-5 space-y-1 text-xs text-slate-500">
            <p>GSTIN: {SITE.gst}</p>
            <p>Licence: {SITE.license}</p>
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-red-500">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-slate-400 transition-all duration-300 hover:translate-x-1 hover:text-white inline-block"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[3px] text-red-500">
            Festival Newsletter
          </h4>
          <p className="text-xs text-slate-400">
            Get exclusive early-booking price lists & Deepavali discounts straight to your inbox.
          </p>
          <form onSubmit={subscribe} className="mt-4 space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="field !border-slate-800 !bg-slate-900 !text-white placeholder:!text-slate-500 focus:!border-red-500"
            />
            <button
              type="submit"
              className="btn-gold w-full py-2.5 text-[12px] font-bold uppercase tracking-wider"
            >
              Subscribe
            </button>
            {msg && <p className="text-xs text-red-400 font-medium">{msg}</p>}
          </form>
        </div>
      </div>

      <div className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="shell flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© 2026 {SITE.name}. All rights reserved. Sivakasi, Tamil Nadu.</p>
          <div className="flex gap-4 font-medium text-slate-400">
            <Link href="/legal" className="hover:text-red-400">
              Terms & Conditions
            </Link>
            <Link href="/legal" className="hover:text-red-400">
              Privacy Policy
            </Link>
            <Link href="/safety" className="hover:text-red-400">
              PESO Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
