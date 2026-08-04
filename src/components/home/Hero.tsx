"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Play, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const SHOWCASE = [
  { label: "Sky Shots", tamil: "வான வெடி", image: "/categories/sky-shots.jpg", slug: "sky-shots", color: "#0057FF" },
  { label: "Rockets", tamil: "ராக்கெட்", image: "/categories/rockets.jpg", slug: "rockets", color: "#FF8C00" },
  { label: "Flower Pots", tamil: "பூச்சட்டி", image: "/categories/flower-pots.jpg", slug: "flower-pots", color: "#D4AF37" },
  { label: "Ground Chakkar", tamil: "நிலச்சக்கரம்", image: "/categories/ground-chakkar.jpg", slug: "ground-chakkar", color: "#00D26A" },
  { label: "Sparklers", tamil: "மத்தாப்பு", image: "/categories/sparklers.jpg", slug: "sparklers", color: "#FF3131" },
];

export function Hero({ stats }: { stats: { products: number; categories: number } }) {
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
    <section className="relative overflow-hidden pb-24 pt-14 lg:pt-20">
      <div className="shell grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[11px] uppercase tracking-[3px] text-gold"
          >
            <span className="h-1.5 w-1.5 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full bg-gold" />
            Sivakasi · PESO Licensed · Since 1994
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 font-display text-[42px] font-bold leading-[1.05] tracking-[-1px] text-balance sm:text-[58px] lg:text-[66px]"
          >
            Celebrate Every Festival <br className="hidden sm:block" />
            with <span className="gold-text">Premium Sivakasi</span> Fireworks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/60"
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
            className="mt-11 grid max-w-lg grid-cols-3 gap-5 border-t border-white/8 pt-7"
          >
            {[
              { k: "80%", v: "Off MRP" },
              { k: "48hr", v: "Dispatch" },
              { k: "12k+", v: "Happy Families" },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-[26px] font-bold text-gold">{s.k}</p>
                <p className="text-[11.5px] uppercase tracking-[2px] text-white/45">{s.v}</p>
              </div>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center gap-5 text-[12px] text-white/45">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-verde" /> Safe & sealed packing
            </span>
            <span className="flex items-center gap-2">
              <Truck size={15} className="text-gold" /> Pan-India transport
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
          {/* Background Glow */}
          <div className="absolute h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.25),transparent_66%)] blur-3xl" />

          {/* Left / Right Nav Buttons */}
          <button
            aria-label="Previous slide"
            onClick={handlePrev}
            className="glass absolute left-0 z-30 flex h-11 w-11 items-center justify-center rounded-full text-gold transition-all duration-300 hover:scale-110 hover:border-gold md:left-2"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            aria-label="Next slide"
            onClick={handleNext}
            className="glass absolute right-0 z-30 flex h-11 w-11 items-center justify-center rounded-full text-gold transition-all duration-300 hover:scale-110 hover:border-gold md:right-2"
          >
            <ChevronRight size={22} />
          </button>

          {/* Coverflow Slide Track */}
          <div className="relative flex h-[350px] w-full max-w-[420px] items-center justify-center perspective-1000">
            {SHOWCASE.map((item, index) => {
              // Calculate offset relative to active card (-2, -1, 0, 1, 2)
              let offset = index - active;
              if (offset > 2) offset -= SHOWCASE.length;
              if (offset < -2) offset += SHOWCASE.length;

              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              // Coverflow transformations
              const translateX = offset * 110; // offset in px
              const scale = isCenter ? 1 : 0.82;
              const rotateY = offset * -25; // 3D rotation angle
              const zIndex = 20 - Math.abs(offset) * 5;
              const opacity = isCenter ? 1 : Math.abs(offset) === 1 ? 0.65 : 0.3;

              return (
                <motion.div
                  key={item.label}
                  onClick={() => setActive(index)}
                  className="absolute h-[340px] w-[240px] cursor-pointer overflow-hidden rounded-[32px] border glass transition-all duration-700 sm:h-[380px] sm:w-[270px]"
                  animate={{
                    x: translateX,
                    scale,
                    rotateY,
                    opacity,
                    zIndex,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    borderColor: isCenter ? item.color : "rgba(212, 175, 55, 0.2)",
                    boxShadow: isCenter
                      ? `0 25px 70px -20px ${item.color}bb, inset 0 0 20px ${item.color}33`
                      : "0 10px 30px -15px rgba(0,0,0,0.8)",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div
                    className="absolute inset-x-0 bottom-0 p-6"
                    style={{ borderTop: isCenter ? `1px solid ${item.color}66` : "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: item.color }}>
                      {item.tamil}
                    </p>
                    <p className="font-display text-xl font-bold text-white mt-1">{item.label}</p>
                    {isCenter && (
                      <Link
                        href={`/products?category=${item.slug}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[2px] text-gold hover:underline"
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
                    ? "w-8 bg-gold shadow-[0_0_12px_rgba(212,175,55,0.9)]"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
