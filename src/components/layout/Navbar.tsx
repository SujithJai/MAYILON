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
        <div className="relative h-8 overflow-hidden bg-red-600 text-white font-bold border-b border-red-700 shadow-sm">
          <div className="ticker-track flex w-max items-center gap-10 py-[7px] text-[11px] uppercase tracking-[3px]">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap">
                {t}
                <span className="text-red-200">✦</span>
              </span>
            ))}
          </div>
        </div>

        <header
          className={`transition-all duration-500 ${
            scrolled
              ? "border-b border-red-500/20 bg-white/95 backdrop-blur-2xl shadow-md"
              : "border-b border-slate-200/80 bg-white/85 backdrop-blur-md"
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
                    className={`group relative rounded-xl px-3.5 py-2 text-[13px] font-bold tracking-[1px] transition-all duration-300 ${
                      active ? "text-red-600" : "text-slate-700 hover:text-red-600"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left bg-red-600 transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:border-red-600 hover:text-red-600"
              >
                <Search size={17} />
              </button>
              <a
                href={`tel:${SITE.phoneRaw}`}
                aria-label="Call Mayilon Crackers"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:border-red-600 hover:text-red-600 sm:flex"
              >
                <Phone size={16} />
              </a>
              <Link
                href="/estimate"
                className="btn-gold relative flex h-10 items-center gap-2 px-4 text-[12.5px] uppercase font-bold"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Cart / Order</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-red-600 shadow">
                    {count}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition lg:hidden"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-slate-200 bg-white p-6 shadow-xl lg:hidden"
              >
                <nav className="flex flex-col gap-3">
                  {LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="rounded-xl p-3 text-[15px] font-bold text-slate-800 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-3">
                    <a
                      href={waLink("Hi Mayilon Crackers!")}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase"
                    >
                      WhatsApp Us
                    </a>
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
