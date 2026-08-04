"use client";

import { useEffect, useRef } from "react";
import { createFireworksEngine, FIREWORK_PALETTES } from "@/lib/fx/fireworks";

export function FireworksBackdrop() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const engine = createFireworksEngine(canvas, { quality: "medium", autoLaunch: false });
    engine.start();

    let timerId: NodeJS.Timeout | null = null;
    let initialTimerId: NodeJS.Timeout | null = null;

    // Launch exactly ONE single sky shot rocket at a time
    const launchSingleSkyShot = () => {
      // Don't launch if tab is not active / user is away
      if (document.hidden) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Random position: Left (10-25%), Center (35-65%), Right (70-90%)
      const zone = Math.random();
      let randomX = w * 0.5;
      if (zone < 0.35) {
        randomX = w * (0.10 + Math.random() * 0.20);
      } else if (zone < 0.70) {
        randomX = w * (0.35 + Math.random() * 0.30);
      } else {
        randomX = w * (0.70 + Math.random() * 0.20);
      }

      const randomY = h * (0.15 + Math.random() * 0.28);
      const randomPalette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

      engine.launch({
        x: randomX,
        targetY: randomY,
        palette: randomPalette,
        power: 1.5,
      });
    };

    // Schedule next SINGLE launch every 5 to 7 seconds
    const scheduleNext = () => {
      if (timerId) clearTimeout(timerId);
      const delay = 5000 + Math.random() * 2000; // 5 to 7 seconds
      timerId = setTimeout(() => {
        if (!document.hidden) {
          launchSingleSkyShot();
        }
        scheduleNext();
      }, delay);
    };

    // Initial launch after 2 seconds
    initialTimerId = setTimeout(() => {
      if (!document.hidden) {
        launchSingleSkyShot();
      }
      scheduleNext();
    }, 2000);

    // Tab visibility listener: stop queue when away, resume clean when returning
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerId) clearTimeout(timerId);
        if (initialTimerId) clearTimeout(initialTimerId);
      } else {
        // User came back: wait 2.5s and restart single launch cycle
        if (timerId) clearTimeout(timerId);
        initialTimerId = setTimeout(() => {
          launchSingleSkyShot();
          scheduleNext();
        }, 2500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerId) clearTimeout(timerId);
      if (initialTimerId) clearTimeout(initialTimerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
