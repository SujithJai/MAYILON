"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createFireworksEngine } from "@/lib/fx/fireworks";

const INTRO_KEY = "mayilon_skyshot_intro_3s_v1";

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
      starCount: 200,
    });
    engine.start();

    const w = window.innerWidth;
    const h = window.innerHeight;

    // 1. Rocket launch from bottom center to upper sky (30% height)
    engine.launch({
      x: w / 2,
      targetY: h * 0.28,
      palette: ["#FFE9A8", "#D4AF37", "#FF3131", "#0057FF", "#00D26A"],
      power: 2.4,
    });

    // 2. Explosive multi-color Sky Shot blast at 1.2s
    const burstTimer = setTimeout(() => {
      setPhase("burst");

      // Main ultra-colorful fireworks bloom
      engine.burst(w / 2, h * 0.28, {
        palette: ["#FF3131", "#D4AF37", "#0057FF", "#00D26A", "#A855F7", "#FFE9A8"],
        power: 3.0,
        count: 600,
      });
      engine.shockwave(w / 2, h * 0.28, "#D4AF37");

      // Side flash bursts for full screen bloom
      setTimeout(() => {
        engine.burst(w * 0.38, h * 0.32, {
          palette: ["#0057FF", "#6BFFB0", "#FFE9A8"],
          power: 1.6,
          count: 280,
        });
        engine.burst(w * 0.62, h * 0.32, {
          palette: ["#FF3131", "#E4C7FF", "#D4AF37"],
          power: 1.6,
          count: 280,
        });
      }, 200);
    }, 1200);

    // 3. Smooth dissolve out starts at 2.2s
    const dissolveTimer = setTimeout(() => {
      setPhase("dissolve");
    }, 2200);

    // 4. Exact 3-second completion -> reveal site
    const finishTimer = setTimeout(() => {
      setPhase("done");
      setActive(false);
      document.body.style.overflow = "";
      engine.destroy();
    }, 3000);

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
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Ambient center fireworks flash glow */}
        <div
          className={`absolute left-1/2 top-[28%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#D4AF37_0%,#FF3131_30%,#0057FF_60%,transparent_75%)] transition-all duration-700 ${
            phase === "burst" ? "opacity-40 scale-125" : "opacity-0 scale-50"
          }`}
          style={{ filter: "blur(45px)" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
