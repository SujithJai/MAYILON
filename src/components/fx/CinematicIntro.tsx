"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createFireworksEngine, FIREWORK_PALETTES } from "@/lib/fx/fireworks";

const INTRO_KEY = "mayilon_skyshot_intro_v2";

export function CinematicIntro() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<"launching" | "burst" | "dissolve" | "done">("launching");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(INTRO_KEY);
    if (seen) return;
    sessionStorage.setItem(INTRO_KEY, "1");

    setActive(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createFireworksEngine(canvas, {
      quality: "high",
      autoLaunch: false,
      starCount: 180,
    });
    engine.start();

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Step 1: Launch Sky Shot rocket from bottom center to upper 30% of screen
    engine.launch({
      x: w / 2,
      targetY: h * 0.3,
      palette: ["#FFE9A8", "#D4AF37", "#FF3131", "#0057FF", "#00D26A"],
      power: 2.2,
    });

    // Step 2: Sky Shot Burst after rocket reaches target height (~1.1s)
    const burstTimer = setTimeout(() => {
      setPhase("burst");
      // Multi-color explosive burst
      engine.burst(w / 2, h * 0.3, {
        palette: ["#FF3131", "#D4AF37", "#0057FF", "#00D26A", "#A855F7", "#FFE9A8"],
        power: 2.8,
        count: 550,
      });
      engine.shockwave(w / 2, h * 0.3, "#D4AF37");

      // Secondary side bursts for full colorful coverage
      setTimeout(() => {
        engine.burst(w / 2 - 140, h * 0.35, {
          palette: ["#0057FF", "#6BFFB0", "#FFE9A8"],
          power: 1.5,
          count: 260,
        });
        engine.burst(w / 2 + 140, h * 0.35, {
          palette: ["#FF3131", "#E4C7FF", "#D4AF37"],
          power: 1.5,
          count: 260,
        });
      }, 250);
    }, 1100);

    // Step 3: Smooth dissolve out (~2.4s)
    const dissolveTimer = setTimeout(() => {
      setPhase("dissolve");
    }, 2500);

    // Step 4: Finish intro and reveal website (~3.5s)
    const finishTimer = setTimeout(() => {
      setPhase("done");
      setActive(false);
      document.body.style.overflow = "";
      engine.destroy();
    }, 3600);

    return () => {
      clearTimeout(burstTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(finishTimer);
      engine.destroy();
    };
  }, [active]);

  if (!active || phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="skyshot-intro"
        className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden bg-[#030305]"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "dissolve" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        
        {/* Subtle center gold glow on burst */}
        <div
          className={`absolute left-1/2 top-[30%] h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#D4AF37_0%,#FF3131_30%,#0057FF_60%,transparent_75%)] transition-opacity duration-700 ${
            phase === "burst" ? "opacity-35 scale-125" : "opacity-0 scale-50"
          }`}
          style={{ filter: "blur(40px)" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
