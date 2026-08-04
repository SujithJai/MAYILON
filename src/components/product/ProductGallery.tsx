"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Expand, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [full, setFull] = useState(false);
  const [spin, setSpin] = useState(0);
  const dragging = useRef<number | null>(null);

  const list = images.length ? images : [""];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      on: true,
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  return (
    <div>
      <div
        className="glass group relative aspect-square overflow-hidden rounded-[30px]"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
        onPointerDown={(e) => (dragging.current = e.clientX)}
        onPointerUp={() => (dragging.current = null)}
        onPointerMove={(e) => {
          if (dragging.current === null) return;
          const delta = e.clientX - dragging.current;
          dragging.current = e.clientX;
          setSpin((s) => s + delta * 0.4);
        }}
        style={{ perspective: "1200px" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={list[active]}
            src={list[active]}
            alt={`${name} view ${active + 1}`}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1, rotateY: spin * 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full cursor-zoom-in object-cover"
            style={{
              transformStyle: "preserve-3d",
              transform: zoom.on ? `scale(1.7)` : undefined,
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
            draggable={false}
          />
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.09),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />

        <button
          onClick={() => setFull(true)}
          aria-label="Fullscreen"
          className="glass-dark absolute right-4 top-4 rounded-xl p-2.5 text-gold transition hover:bg-gold/20"
        >
          <Expand size={16} />
        </button>
        <div className="glass-dark absolute bottom-4 left-4 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-white/70">
          <RotateCcw size={12} className="text-gold" /> Drag to rotate · hover to zoom
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {list.map((src, i) => (
          <button
            key={`${src}-${i}`}
            onClick={() => setActive(i)}
            className={`overflow-hidden rounded-[18px] border transition-all duration-500 ${
              active === i
                ? "border-gold shadow-[0_0_26px_-8px_rgba(212,175,55,0.9)]"
                : "border-white/10 opacity-60 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${name} thumbnail ${i + 1}`} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {full && (
          <motion.div
            className="fixed inset-0 z-[900] flex items-center justify-center bg-black/95 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFull(false)}
          >
            <button className="absolute right-6 top-6 text-white/60 hover:text-gold" aria-label="Close">
              <X size={26} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={list[active]}
              alt={name}
              className="max-h-[88vh] max-w-[92vw] rounded-[28px] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
