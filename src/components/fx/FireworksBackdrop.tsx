"use client";

import { useEffect, useRef } from "react";
import { createFireworksEngine, FIREWORK_PALETTES } from "@/lib/fx/fireworks";

export function FireworksBackdrop() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // Guaranteed fireworks engine start across all devices
    const engine = createFireworksEngine(canvas, { quality: "medium", autoLaunch: false });
    engine.start();

    // Random sky shot launch function covering Left, Center, Right, and Corners
    const launchSkyShot = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Random X: Left (10-25%), Center (35-65%), Right (72-90%)
      const zone = Math.random();
      let randomX = w * 0.5;
      if (zone < 0.35) {
        randomX = w * (0.10 + Math.random() * 0.20); // Left & Corner
      } else if (zone < 0.70) {
        randomX = w * (0.35 + Math.random() * 0.30); // Center
      } else {
        randomX = w * (0.70 + Math.random() * 0.20); // Right & Corner
      }

      const randomY = h * (0.15 + Math.random() * 0.28);
      const randomPalette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

      engine.launch({
        x: randomX,
        targetY: randomY,
        palette: randomPalette,
        power: 1.6 + Math.random() * 0.8,
      });
    };

    // Initial immediate launch after 800ms
    const firstShot = setTimeout(launchSkyShot, 800);

    // Continuous periodic launch every 4 to 6 seconds (4000ms to 6000ms)
    let timerId: NodeJS.Timeout;
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 2000;
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
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden">
      {/* Ambient background light glows */}
      <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)] blur-2xl pointer-events-none" />
      <div className="absolute -left-40 top-1/3 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,87,255,0.14),transparent_65%)] blur-3xl pointer-events-none" />
      
      {/* Sky Shot Fireworks Canvas Overlay with 55% Opacity */}
      <canvas ref={ref} className="h-full w-full opacity-60 pointer-events-none" />
    </div>
  );
}
