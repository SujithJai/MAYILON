/**
 * Mayilon cinematic particle engine.
 * Canvas2D with additive blending + depth projection — no WebGL dependency,
 * runs at 60fps on mid-range mobile and degrades automatically.
 */

export type Quality = "high" | "medium" | "low";

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  hue: string;
  drag: number;
  gravity: number;
  flicker: number;
  kind: 0 | 1 | 2; // 0 spark, 1 smoke, 2 dust
};

type Shell = {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  hue: string;
  size: number;
  trail: number;
  payload: number;
};

const PALETTES: string[][] = [
  ["#FFE9A8", "#D4AF37", "#FFF6D5", "#FFC048"],
  ["#FF6B6B", "#FF3131", "#FFB3B3", "#FFD34E"],
  ["#7FB2FF", "#0057FF", "#CFE1FF", "#9AF0FF"],
  ["#6BFFB0", "#00D26A", "#D8FFEC", "#C6FF6B"],
  ["#E4C7FF", "#A855F7", "#FFD6FA", "#7FB2FF"],
  ["#FFFFFF", "#E8E8F0", "#D4AF37", "#BFD4FF"],
];

export type EngineOptions = {
  quality?: Quality;
  ambient?: boolean;
  starCount?: number;
  autoLaunch?: boolean;
};

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return "low";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = window.innerWidth < 820;
  if (mobile || cores <= 4) return "medium";
  if (cores >= 8 && window.innerWidth >= 1280) return "high";
  return "medium";
}

export function createFireworksEngine(canvas: HTMLCanvasElement, options: EngineOptions = {}) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return {
      start() {},
      stop() {},
      destroy() {},
      burst() {},
      launch() {},
      setAutoLaunch() {},
      shockwave() {},
    };
  }

  let quality: Quality = options.quality ?? detectQuality();
  let autoLaunch = options.autoLaunch ?? true;
  let running = false;
  let raf = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let last = 0;
  let nextLaunch = 600;

  const particles: Particle[] = [];
  const shells: Shell[] = [];
  const rings: { x: number; y: number; r: number; life: number; hue: string }[] = [];
  let flash = 0;

  const budget = () => (quality === "high" ? 3200 : quality === "medium" ? 1500 : 550);
  const payloadFor = () => (quality === "high" ? 260 : quality === "medium" ? 140 : 60);

  const stars: { x: number; y: number; r: number; a: number; s: number }[] = [];
  function seedStars() {
    stars.length = 0;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1.5);
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pushParticle(p: Particle) {
    if (particles.length >= budget()) particles.shift();
    particles.push(p);
  }

  function burst(x: number, y: number, opts: { palette?: string[]; power?: number; count?: number } = {}) {
    const palette = opts.palette ?? PALETTES[(Math.random() * PALETTES.length) | 0];
    const power = opts.power ?? 1;
    const count = Math.floor((opts.count ?? payloadFor()) * power);
    const shape = Math.random();

    for (let i = 0; i < count; i++) {
      // spherical shell distribution projected to 2.5D
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speedBase = shape > 0.72 ? 1.5 + Math.random() * 3.4 : 2.4 + Math.random() * 2.2;
      const speed = speedBase * power * (0.6 + Math.random() * 0.8);
      pushParticle({
        x,
        y,
        z: 0,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed * 0.55,
        life: 0,
        maxLife: 60 + Math.random() * 70,
        size: 1 + Math.random() * 1.9,
        hue: palette[(Math.random() * palette.length) | 0],
        drag: 0.975,
        gravity: 0.032,
        flicker: Math.random() * 6,
        kind: 0,
      });
    }

    flash = Math.min(0.6, flash + 0.2 * power);
  }

  function launch(opts: { x?: number; targetY?: number; palette?: string[]; power?: number } = {}) {
    const x = opts.x ?? w * (0.12 + Math.random() * 0.76);
    const targetY = opts.targetY ?? h * (0.12 + Math.random() * 0.3);
    const palette = opts.palette ?? PALETTES[(Math.random() * PALETTES.length) | 0];
    shells.push({
      x,
      y: h + 12,
      vy: -(7.5 + Math.random() * 3.4),
      targetY,
      hue: palette[0],
      size: 2.1,
      trail: 0,
      payload: opts.power ?? 1,
    });
  }

  function shockwave(x: number, y: number, hue = "#D4AF37") {
    flash = Math.min(0.5, flash + 0.3);
  }

  function step(dt: number) {
    // fade previous frame while preserving canvas transparency
    ctx!.globalCompositeOperation = "destination-out";
    ctx!.fillStyle = `rgba(0,0,0,${quality === "low" ? 0.3 : 0.17})`;
    ctx!.fillRect(0, 0, w, h);
    ctx!.globalCompositeOperation = "lighter";



    // shells
    for (let i = shells.length - 1; i >= 0; i--) {
      const sh = shells[i];
      sh.y += sh.vy * dt;
      sh.vy += 0.055 * dt;
      sh.trail += dt;

      const g = ctx!.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 16);
      g.addColorStop(0, "rgba(255,240,200,0.95)");
      g.addColorStop(0.4, "rgba(255,160,50,0.5)");
      g.addColorStop(1, "rgba(255,120,0,0)");
      ctx!.fillStyle = g;
      ctx!.beginPath();
      ctx!.arc(sh.x, sh.y, 16, 0, Math.PI * 2);
      ctx!.fill();

      if (quality !== "low") {
        for (let k = 0; k < 2; k++) {
          pushParticle({
            x: sh.x + (Math.random() - 0.5) * 3,
            y: sh.y + Math.random() * 5,
            z: 0,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.9 + 0.3,
            vz: 0,
            life: 0,
            maxLife: 26 + Math.random() * 22,
            size: 1 + Math.random(),
            hue: Math.random() > 0.4 ? "#FF8C00" : "#FFE9A8",
            drag: 0.96,
            gravity: 0.01,
            flicker: 3,
            kind: 0,
          });
        }
      }

      if (sh.y <= sh.targetY || sh.vy >= -0.6) {
        burst(sh.x, sh.y, { power: sh.payload });
        shells.splice(i, 1);
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.vz *= p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const depth = 1 / (1 + Math.abs(p.z) * 0.008);
      const lifeRatio = 1 - p.life / p.maxLife;

      if (p.kind === 1) {
        ctx!.globalAlpha = lifeRatio * 0.16;
        ctx!.fillStyle = "rgba(140,140,170,1)";
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * (1 + p.life / p.maxLife), 0, Math.PI * 2);
        ctx!.fill();
        continue;
      }

      const twinkle = p.flicker ? 0.65 + 0.35 * Math.sin(p.life * 0.6 + p.flicker) : 1;
      ctx!.globalAlpha = Math.max(0, lifeRatio * twinkle);
      ctx!.fillStyle = p.hue;
      const r = Math.max(0.3, p.size * depth * (0.4 + lifeRatio * 0.8));
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx!.fill();

      if (quality === "high" && lifeRatio > 0.6) {
        ctx!.globalAlpha = lifeRatio * 0.16;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;

    // shockwave rings
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.r += 6.5 * dt;
      ring.life -= 0.035 * dt;
      if (ring.life <= 0) {
        rings.splice(i, 1);
        continue;
      }
      ctx!.globalAlpha = ring.life * 0.4;
      ctx!.strokeStyle = ring.hue;
      ctx!.lineWidth = 2 * ring.life;
      ctx!.beginPath();
      ctx!.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx!.stroke();
    }
    ctx!.globalAlpha = 1;

    // ambient flash lighting
    if (flash > 0.01) {
      ctx!.globalAlpha = flash * 0.14;
      ctx!.fillStyle = "#D4AF37";
      ctx!.fillRect(0, 0, w, h);
      ctx!.globalAlpha = 1;
      flash *= 0.9;
    }
  }

  function frame(now: number) {
    if (!running) return;
    const delta = Math.min(3, (now - last) / 16.667 || 1);
    last = now;

    if (autoLaunch) {
      nextLaunch -= delta * 16.667;
      if (nextLaunch <= 0) {
        launch();
        if (quality === "high" && Math.random() > 0.6) {
          setTimeout(() => running && launch(), 320);
        }
        nextLaunch = 3400 + Math.random() * 5200;
      }
    }

    step(delta);
    raf = requestAnimationFrame(frame);
  }

  const onResize = () => resize();
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  seedStars();
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return {
    start,
    stop,
    burst,
    launch,
    shockwave,
    setAutoLaunch(v: boolean) {
      autoLaunch = v;
    },
    setQuality(q: Quality) {
      quality = q;
      resize();
      seedStars();
    },
    destroy() {
      stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      particles.length = 0;
      shells.length = 0;
    },
  };
}

export const FIREWORK_PALETTES = PALETTES;
