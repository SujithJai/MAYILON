"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Play, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";

const SHOWCASE = [
  { label: "Sky Shots", tamil: "வான வெடி", image: "/categories/sky-shots.jpg", color: "#0057FF" },
  { label: "Rockets", tamil: "ராக்கெட்", image: "/categories/rockets.jpg", color: "#FF8C00" },
  { label: "Flower Pots", tamil: "பூச்சட்டி", image: "/categories/flower-pots.jpg", color: "#D4AF37" },
  { label: "Ground Chakkar", tamil: "நிலச்சக்கரம்", image: "/categories/ground-chakkar.jpg", color: "#00D26A" },
  { label: "Sparklers", tamil: "மத்தாப்பு", image: "/categories/sparklers.jpg", color: "#FF3131" },
];

export function Hero({ stats }: { stats: { products: number; categories: number } }) {
  const [angle, setAngle] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused) {
        setAngle((prev) => prev + 72);
      }
    }, 3200);
    return () => window.clearInterval(id);
  }, [paused]);

  const handlePrev = () => setAngle((prev) => prev - 72);
  const handleNext = () => setAngle((prev) => prev + 72);

  const activeIndex = (Math.round(angle / 72) % 5 + 5) % 5;

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

        {/* 3D rotating showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-[460px] items-center justify-center lg:h-[540px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.25),transparent_66%)] blur-3xl" />
          
          <button
            aria-label="Previous showcase"
            onClick={handlePrev}
            className="glass absolute left-2 z-30 flex h-10 w-10 items-center justify-center rounded-full text-gold transition-transform hover:scale-110 md:left-6"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            aria-label="Next showcase"
            onClick={handleNext}
            className="glass absolute right-2 z-30 flex h-10 w-10 items-center justify-center rounded-full text-gold transition-transform hover:scale-110 md:right-6"
          >
            <ChevronRight size={20} />
          </button>

          <div
            className="relative h-[320px] w-[240px] sm:h-[360px] sm:w-[270px]"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: -angle }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {SHOWCASE.map((s, i) => (
                <div
                  key={s.label}
                  className="glass absolute inset-0 overflow-hidden rounded-[30px] border border-gold/30"
                  style={{
                    transform: `rotateY(${i * 72}deg) translateZ(260px)`,
                    backfaceVisibility: "hidden",
                    boxShadow: `0 25px 70px -30px ${s.color}aa`,
                  }}
                >
                  <img
                    src={s.image}
                    alt={s.label}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                  <div
                    className="absolute inset-x-0 bottom-0 p-6"
                    style={{ borderTop: `1px solid ${s.color}55` }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: s.color }}>
                      {s.tamil}
                    </p>
                    <p className="font-display text-xl font-bold text-white">{s.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* reflection plate */}
          <div className="absolute bottom-6 h-24 w-72 rounded-[50%] bg-[radial-gradient(ellipse,rgba(212,175,55,0.18),transparent_70%)] blur-xl" />

          <div className="absolute bottom-0 flex items-center gap-2 z-20">
            {SHOWCASE.map((s, i) => (
              <button
                key={s.label}
                aria-label={`Show ${s.label}`}
                onClick={() => setAngle(i * 72)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  activeIndex === i ? "w-8 bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)]" : "w-3 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
