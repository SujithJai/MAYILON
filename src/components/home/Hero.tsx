"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Play, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const SHOWCASE = [
  { label: "Sky Shots", tamil: "வான வெடி", image: "/categories/sky-shots.jpg", slug: "sky-shots", color: "#DC2626" },
  { label: "Rockets", tamil: "ராக்கெட்", image: "/categories/rockets.jpg", slug: "rockets", color: "#EA580C" },
  { label: "Flower Pots", tamil: "பூச்சட்டி", image: "/categories/flower-pots.jpg", slug: "flower-pots", color: "#D97706" },
  { label: "Ground Chakkar", tamil: "நிலச்சக்கரம்", image: "/categories/ground-chakkar.jpg", slug: "ground-chakkar", color: "#16A34A" },
  { label: "Sparklers", tamil: "மத்தாப்பு", image: "/categories/sparklers.jpg", slug: "sparklers", color: "#DC2626" },
];

export function Hero({ stats }: { stats: { products: number; categories: number }; images?: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SHOWCASE.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [paused]);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + SHOWCASE.length) % SHOWCASE.length);
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % SHOWCASE.length);
  };

  return (
    <section className="relative overflow-hidden pb-20 pt-10 lg:pt-16">
      <div className="shell grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 rounded-full border border-red-500/20 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[3px] text-red-600 shadow-sm"
          >
            <span className="h-2 w-2 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full bg-red-600" />
            Sivakasi · PESO Licensed · Since 1994
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-display text-[42px] font-bold leading-[1.05] tracking-[-1px] text-slate-900 text-balance sm:text-[58px] lg:text-[66px]"
          >
            Celebrate Every Festival <br className="hidden sm:block" />
            with <span className="gold-text">Premium Sivakasi</span> Fireworks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-600 font-medium"
          >
            Luxury fireworks collection direct from our Sivakasi factory. {stats.products}+ products
            across {stats.categories} categories at up to 80% off MRP — build an instant estimate,
            get factory pricing, dispatch in 48 hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href="/products" className="btn-gold group flex items-center gap-2 px-7 py-3.5 text-sm uppercase">
              Explore Products
              <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <Link href="/estimate" className="btn-ghost flex items-center gap-2 px-7 py-3.5 text-sm uppercase">
              <Play size={15} /> Quick Estimate
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="mt-11 grid max-w-lg grid-cols-3 gap-5 border-t border-slate-200 pt-7"
          >
            {[
              { k: "80%", v: "Off MRP" },
              { k: "48hr", v: "Dispatch" },
              { k: "12k+", v: "Happy Families" },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-[28px] font-bold text-red-600">{s.k}</p>
                <p className="text-[11.5px] font-bold uppercase tracking-[2px] text-slate-500">{s.v}</p>
              </div>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-[12.5px] font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Safe & sealed packing
            </span>
            <span className="flex items-center gap-2">
              <Truck size={16} className="text-red-600" /> Pan-India transport
            </span>
          </div>
        </div>

        {/* 3D Coverflow Auto-sliding showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-[480px] items-center justify-center lg:h-[540px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Background Ambient Glow */}
          <div className="absolute h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.15),transparent_66%)] blur-3xl" />

          {/* Left / Right Nav Buttons */}
          <button
            aria-label="Previous slide"
            onClick={handlePrev}
            className="absolute left-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-white/90 text-red-600 shadow-md transition-all duration-300 hover:scale-110 hover:border-red-600 md:left-2"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            aria-label="Next slide"
            onClick={handleNext}
            className="absolute right-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-white/90 text-red-600 shadow-md transition-all duration-300 hover:scale-110 hover:border-red-600 md:right-2"
          >
            <ChevronRight size={22} />
          </button>

          {/* Coverflow Slide Track */}
          <div className="relative flex h-[350px] w-full max-w-[420px] items-center justify-center perspective-1000">
            {SHOWCASE.map((item, index) => {
              let offset = index - active;
              if (offset > 2) offset -= SHOWCASE.length;
              if (offset < -2) offset += SHOWCASE.length;

              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              const translateX = offset * 110;
              const scale = isCenter ? 1 : 0.82;
              const rotateY = offset * -25;
              const zIndex = 20 - Math.abs(offset) * 5;
              const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.7 : 0.35;

              return (
                <motion.div
                  key={item.label}
                  onClick={() => setActive(index)}
                  className="absolute h-[340px] w-[240px] cursor-pointer overflow-hidden rounded-[32px] border bg-white transition-all duration-700 sm:h-[380px] sm:w-[270px]"
                  animate={{
                    x: translateX,
                    scale,
                    rotateY,
                    opacity,
                    zIndex,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    borderColor: isCenter ? item.color : "rgba(220, 38, 38, 0.2)",
                    boxShadow: isCenter
                      ? `0 25px 60px -20px ${item.color}88, 0 10px 30px -15px rgba(0,0,0,0.15)`
                      : "0 10px 25px -15px rgba(0,0,0,0.12)",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

                  <div
                    className="absolute inset-x-0 bottom-0 p-6"
                    style={{ borderTop: isCenter ? `1px solid ${item.color}66` : "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: item.color }}>
                      {item.tamil}
                    </p>
                    <p className="font-display text-xl font-bold text-white mt-1">{item.label}</p>
                    {isCenter && (
                      <Link
                        href={`/products?category=${item.slug}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[2px] text-red-400 hover:underline"
                      >
                        Browse Category <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Indicator Dots */}
          <div className="absolute bottom-2 flex items-center gap-2 z-30">
            {SHOWCASE.map((item, index) => (
              <button
                key={item.label}
                aria-label={`Go to slide ${item.label}`}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  active === index
                    ? "w-8 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)]"
                    : "w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
