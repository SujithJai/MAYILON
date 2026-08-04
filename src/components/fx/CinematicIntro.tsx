"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { createFireworksEngine, detectQuality } from "@/lib/fx/fireworks";

const KEY = "mayilon:intro:v1";

type Beat = "dark" | "logo" | "ignition" | "launch" | "explode" | "bloom" | "done";

export function CinematicIntro() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const [beat, setBeat] = useState<Beat>("dark");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timers = useRef<number[]>([]);
  const engineRef = useRef<ReturnType<typeof createFireworksEngine> | null>(null);

  const finish = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    engineRef.current?.destroy();
    engineRef.current = null;
    setBeat("done");
    window.setTimeout(() => {
      setActive(false);
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("mayilon:intro-complete"));
    }, 900);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(KEY);
    const quality = detectQuality();
    if (seen || reduce || quality === "low") {
      return;
    }
    sessionStorage.setItem(KEY, "1");
    setActive(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [reduce]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createFireworksEngine(canvas, { autoLaunch: false, starCount: 260 });
    engineRef.current = engine;
    engine.start();

    const at = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    // Beat 1 — Dark reveal (stars breathe in)
    at(1500, () => setBeat("logo"));
    // Beat 3 — Rocket ignition (fuse sparks at launch pad)
    at(2500, () => {
      setBeat("ignition");
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      let i = 0;
      const spark = window.setInterval(() => {
        engine.burst(w / 2, h - 60, { count: 16, power: 0.22, palette: ["#FF8C00", "#FFE9A8", "#FF3131"] });
        if (++i > 12) window.clearInterval(spark);
      }, 120);
      timers.current.push(spark as unknown as number);
    });
    // Beat 4 — Launch
    at(4400, () => {
      setBeat("launch");
      const rect = canvas.getBoundingClientRect();
      engine.launch({ x: rect.width / 2, targetY: rect.height * 0.28, power: 1 });
    });
    // Beat 5 — Massive explosion
    at(6300, () => {
      setBeat("explode");
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height * 0.32;
      engine.burst(cx, cy, { power: 2.1, count: 620 });
      engine.shockwave(cx, cy);
      at(180, () => engine.burst(cx - rect.width * 0.22, cy + 60, { power: 1.3, count: 320 }));
      at(340, () => engine.burst(cx + rect.width * 0.24, cy - 30, { power: 1.4, count: 340 }));
      at(620, () => engine.burst(cx, cy + 90, { power: 1.6, count: 380 }));
    });
    // Beat 6 — Golden bloom
    at(8100, () => setBeat("bloom"));
    // Beat 7 — Reveal homepage
    at(9500, finish);

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      engine.destroy();
    };
  }, [active, finish]);

  if (!active) return null;

  return (
    <AnimatePresence>
      {beat !== "done" || active ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#020203]"
          initial={{ opacity: 1 }}
          animate={{ opacity: beat === "done" ? 0 : 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {/* slow camera push */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.14 }}
            animate={{ scale: beat === "explode" || beat === "bloom" ? 0.94 : 1 }}
            transition={{ duration: 6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(212,175,55,0.12),transparent_58%)]" />
          </motion.div>

          {/* launch pad smoke */}
          <AnimatePresence>
            {(beat === "ignition" || beat === "launch") && (
              <motion.div
                className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(255,140,0,0.35),transparent_66%)] blur-2xl"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6 }}
              />
            )}
          </AnimatePresence>

          {/* logo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.72, filter: "blur(16px)" }}
              animate={{
                opacity: beat === "dark" ? 0 : 1,
                scale: beat === "explode" || beat === "bloom" ? 1.16 : 1,
                filter: "blur(0px)",
              }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 animate-[pulseGlow_3s_ease-in-out_infinite] rounded-full bg-gold/40 blur-3xl" />
              <LogoMark size={122} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: beat === "dark" ? 0 : 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="gold-text font-display text-4xl font-extrabold uppercase tracking-[10px] sm:text-6xl"
            >
              Mayilon
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: beat === "dark" ? 0 : 0.85 }}
              transition={{ duration: 1.4, delay: 0.5 }}
              className="max-w-md text-sm tracking-[3px] text-white/70 sm:text-base"
            >
              ஒவ்வொரு வெடியிலும் மகிழ்ச்சி!
            </motion.p>
          </div>

          {/* golden bloom transition */}
          <AnimatePresence>
            {beat === "bloom" && (
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#FFF3C4,#D4AF37_28%,transparent_72%)]"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.92, 0], scale: 3.4 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </AnimatePresence>

          {/* skip */}
          <button
            onClick={finish}
            className="glass-dark absolute bottom-7 right-6 rounded-full px-5 py-2.5 text-xs font-medium tracking-[2px] text-gold uppercase transition-all duration-500 hover:border-gold hover:bg-gold/15"
          >
            Skip Intro
          </button>

          {/* beat progress */}
          <div className="absolute bottom-9 left-6 hidden items-center gap-2 sm:flex">
            {["dark", "logo", "ignition", "launch", "explode", "bloom"].map((b) => (
              <span
                key={b}
                className={`h-[3px] w-8 rounded-full transition-all duration-500 ${
                  beat === b ? "bg-gold" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
