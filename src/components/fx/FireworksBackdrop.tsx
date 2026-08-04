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

    // Random sky shot launch function covering Left, Center, Right, and Corners
    const launchSkyShot = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Random position across Left (0.1-0.25), Center (0.35-0.65), Right (0.75-0.9)
      const zone = Math.random();
      let randomX = w * 0.5;
      if (zone < 0.3) {
        randomX = w * (0.1 + Math.random() * 0.18); // Left & Corner
      } else if (zone < 0.7) {
        randomX = w * (0.35 + Math.random() * 0.3); // Center
      } else {
        randomX = w * (0.72 + Math.random() * 0.18); // Right & Corner
      }

      const randomY = h * (0.15 + Math.random() * 0.28);
      const randomPalette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

      engine.launch({
        x: randomX,
        targetY: randomY,
        palette: randomPalette,
        power: 1.5 + Math.random() * 0.8,
      });
    };

    // First sky shot after 1.5 seconds
    const firstShot = setTimeout(launchSkyShot, 1500);

    // Schedule next sky shot every 5 to 7 seconds (5000ms to 7000ms)
    let timerId: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 2000; // 5 to 7 seconds
      timerId = setTimeout(() => {
        launchSkyShot();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      clearTimeout(firstShot);
      clearTimeout(timerId);
      engine.destroy();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      {/* ambient background light rays */}
      <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_62%)] blur-2xl" />
      <div className="absolute -left-40 top-1/3 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,87,255,0.12),transparent_65%)] blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-[38vh] bg-[linear-gradient(to_top,rgba(5,5,10,0.92),transparent)]" />
      
      {/* 50% Opacity Canvas Overlay for subtle background fireworks */}
      <canvas ref={ref} className="h-full w-full opacity-50" />

      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.4)_0px,rgba(255,255,255,0.4)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
