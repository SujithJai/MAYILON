"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, MessageCircle, Sparkles, Tag } from "lucide-react";
import { waLink } from "@/lib/slug";

export type FestivalBannerProps = {
  initialBanner?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    badge?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
    discountText?: string;
  };
};

const DEFAULT_BANNER = {
  enabled: true,
  title: "விநாயகர் சதுர்த்தி & தீபாவளி மெகா சலுகை!",
  subtitle: "Sivakasi Direct Factory Fireworks · Flat 80% Off MRP on All Premium Crackers & Gift Boxes",
  badge: "🐘 Vinayagar Chaturthi & Diwali Mega Sale",
  discountText: "80% FLAT DISCOUNT · ALL TAMIL NADU DELIVERY",
  imageUrl: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1600&q=80",
  buttonText: "Instant Order / Cart",
  buttonLink: "/estimate",
};

export function FestivalOfferBanner({ initialBanner }: FestivalBannerProps) {
  const [banner, setBanner] = useState(() => ({
    ...DEFAULT_BANNER,
    ...initialBanner,
  }));

  // Real-time sync with latest banner config from API
  useEffect(() => {
    let mounted = true;
    fetch("/api/v1/admin/banner", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (mounted && res?.data) {
          setBanner((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  if (!banner.enabled) return null;

  return (
    <section className="w-full my-6 px-3 sm:px-6 lg:px-8">
      <div className="relative w-full overflow-hidden rounded-[28px] sm:rounded-[36px] border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-red-950 to-amber-950 shadow-2xl">
        {/* Background festive image with blend overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-25 scale-105 transition-transform duration-1000 hover:scale-100"
          style={{ backgroundImage: `url(${banner.imageUrl || DEFAULT_BANNER.imageUrl})` }}
        />
        
        {/* Subtle glowing gradients */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-red-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-10 md:p-14 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[2px] text-amber-300 backdrop-blur-md shadow-lg mb-4 sm:mb-5">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>{banner.badge || DEFAULT_BANNER.badge}</span>
            <Flame size={14} className="text-red-400" />
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
            {banner.title || DEFAULT_BANNER.title}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed">
            {banner.subtitle || DEFAULT_BANNER.subtitle}
          </p>

          {/* Discount Tag */}
          <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600/80 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white border border-red-400/40 shadow-md">
            <Tag size={14} className="text-amber-300" />
            <span>{banner.discountText || DEFAULT_BANNER.discountText}</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              href={banner.buttonLink || "/estimate"}
              className="btn-gold flex w-full sm:w-auto items-center justify-center gap-2.5 px-8 py-3.5 text-sm sm:text-base font-extrabold uppercase shadow-xl hover:scale-105 transition"
            >
              <span>{banner.buttonText || DEFAULT_BANNER.buttonText}</span>
              <ArrowRight size={17} />
            </Link>

            <a
              href={waLink(`Hi Mayilon Crackers, I want to book my festive order for ${banner.title}.`)}
              target="_blank"
              rel="noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full border-2 border-emerald-400/40 bg-emerald-600/90 px-7 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-xl hover:bg-emerald-500 hover:scale-105 transition backdrop-blur-md"
            >
              <MessageCircle size={18} />
              <span>WhatsApp Booking</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
