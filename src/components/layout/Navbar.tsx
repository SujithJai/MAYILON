"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { useEstimate } from "@/components/estimate/EstimateProvider";
import { SITE, waLink } from "@/lib/slug";
import { SearchOverlay } from "./SearchOverlay";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/dealers", label: "Wholesale" },
  { href: "/safety", label: "Safety" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const TICKER = [
  "Factory Direct Pricing",
  "80% Off MRP",
  "Premium Sivakasi Quality",
  "Wholesale & Dealer Orders",
  "Festival Offers Live",
  "Safe Packing & Fast Dispatch",
  "PESO Licensed Manufacturer",
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items } = useEstimate();
  const count = items.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[300] print:hidden">
        {/* announcement ticker */}
        <div className="relative h-8 overflow-hidden border-b border-gold/15 bg-black/70 backdrop-blur-md">
          <div className="ticker-track flex w-max items-center gap-10 py-[7px] text-[10.5px] uppercase tracking-[3px] text-gold/80">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {t}
                <span className="text-gold/40">✦</span>
              </span>
            ))}
          </div>
        </div>

        <header
          className={`transition-all duration-700 ${
            scrolled
              ? "border-b border-gold/20 bg-black/80 backdrop-blur-2xl shadow-[0_20px_60px_-40px_rgba(212,175,55,0.6)]"
              : "border-b border-transparent bg-transparent"
          }`}
        >
          <div className="shell flex h-[74px] items-center justify-between gap-4">
            <Link href="/" aria-label="Mayilon Crackers home">
              <LogoLockup />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group relative rounded-xl px-3.5 py-2 text-[13px] font-medium tracking-[1px] text-white/75 transition-all duration-500 hover:text-gold"
                  >
                    {l.label}
                    <span
                      className={`absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-500 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                    {active && (
                      <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full bg-gold" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 text-white/70 transition-all duration-500 hover:border-gold/70 hover:text-gold"
              >
                <Search size={17} />
              </button>
              <a
                href={`tel:${SITE.phoneRaw}`}
                aria-label="Call Mayilon Crackers"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gold/20 text-white/70 transition-all duration-500 hover:border-gold/70 hover:text-gold sm:flex"
              >
                <Phone size={16} />
              </a>
              <Link
                href="/estimate"
                aria-label="Open estimate"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 text-white/70 transition-all duration-500 hover:border-gold/70 hover:text-gold"
              >
                <ShoppingBag size={17} />
                {count > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black">
                    {count}
                  </span>
                )}
              </Link>
              <Link
                href="/estimate"
                className="btn-gold hidden px-5 py-2.5 text-[12.5px] uppercase md:inline-flex"
              >
                Quick Estimate
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 text-gold lg:hidden"
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-b border-gold/20 bg-black/95 backdrop-blur-2xl lg:hidden"
            >
              <div className="shell flex flex-col gap-1 py-5">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-xl px-3 py-3 text-sm tracking-wide text-white/80 transition hover:bg-gold/10 hover:text-gold"
                  >
                    {l.label}
                  </Link>
                ))}
                <a
                  href={waLink("Hi Mayilon Crackers, I would like a price list.")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost mt-2 px-4 py-3 text-center text-sm"
                >
                  WhatsApp Us
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
