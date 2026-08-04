"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";

/** Burning firecracker fuse tied to scroll progress. */
export function ScrollFuse() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 });
  const top = useTransform(progress, [0, 1], ["0%", "100%"]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed right-3 top-0 z-[250] hidden h-full w-6 lg:block print:hidden">
      <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <motion.div
        className="absolute left-1/2 top-0 w-[2px] -translate-x-1/2 origin-top bg-gradient-to-b from-gold via-flame to-ember"
        style={{ scaleY: progress, height: "100%" }}
      />
      <motion.div style={{ top }} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="relative block h-2.5 w-2.5 rounded-full bg-[#FFE9A8] shadow-[0_0_16px_6px_rgba(255,140,0,0.75)]">
          <span className="absolute inset-0 animate-[pulseGlow_1.1s_ease-in-out_infinite] rounded-full bg-flame/70 blur-[6px]" />
        </span>
      </motion.div>
    </div>
  );
}
