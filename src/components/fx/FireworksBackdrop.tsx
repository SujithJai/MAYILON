"use client";

import { useEffect, useRef } from "react";
import { createFireworksEngine, detectQuality } from "@/lib/fx/fireworks";

export function FireworksBackdrop({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const quality = detectQuality();
    const engine = createFireworksEngine(canvas, { quality, autoLaunch: quality !== "low" });
    engine.start();

    if (quality !== "low") {
      const kick = window.setTimeout(() => engine.launch({ power: intensity }), 1200);
      return () => {
        window.clearTimeout(kick);
        engine.destroy();
      };
    }
    return () => engine.destroy();
  }, [intensity]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      {/* moon + light rays */}
      <div className="absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)] blur-2xl" />
      <div className="absolute -left-40 top-1/3 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,87,255,0.14),transparent_65%)] blur-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-[38vh] bg-[linear-gradient(to_top,rgba(5,5,10,0.92),transparent)]" />
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0 opacity-[0.045] mix-blend-overlay [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.4)_0px,rgba(255,255,255,0.4)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
