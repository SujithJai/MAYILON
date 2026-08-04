"use client";

import { useEffect, useRef } from "react";
import { createFireworksEngine, detectQuality, FIREWORK_PALETTES } from "@/lib/fx/fireworks";

export function FireworksBackdrop() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const quality = detectQuality();
    if (quality === "low") return;

    const engine = createFireworksEngine(canvas, { quality, autoLaunch: false });
    engine.start();

    // Launch a colorful sky shot every 5 seconds (5000ms) continuously in different colors!
    const interval = setInterval(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const randomX = w * (0.15 + Math.random() * 0.7);
      const randomY = h * (0.15 + Math.random() * 0.28);
      const randomPalette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

      engine.launch({
        x: randomX,
        targetY: randomY,
        palette: randomPalette,
        power: 1.4 + Math.random() * 0.8,
      });
    }, 5000);

    // Initial launch after 1.8 seconds
    const initialLaunch = setTimeout(() => {
      engine.launch({
        x: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.22,
        palette: FIREWORK_PALETTES[0],
        power: 1.8,
      });
    }, 1800);

    return () => {
      clearInterval(interval);
      clearTimeout(initialLaunch);
      engine.destroy();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      {/* ambient background glows */}
      <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)] blur-2xl" />
      <div className="absolute -left-40 top-1/3 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,87,255,0.14),transparent_65%)] blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-[38vh] bg-[linear-gradient(to_top,rgba(5,5,10,0.92),transparent)]" />
      <canvas ref={ref} className="h-full w-full opacity-90" />
      <div className="absolute inset-0 opacity-[0.045] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.4)_0px,rgba(255,255,255,0.4)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
