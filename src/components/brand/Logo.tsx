import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
};

/** Official Mayilon emblem — Peacock & Vel Pyroworld Emblem */
export function LogoMark({ size = 48, className = "" }: Props) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-black shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-transform duration-500 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt="Mayilon Crackers official logo"
        className="h-full w-full object-cover"
        loading="eager"
      />
    </div>
  );
}

export function LogoLockup({
  size = 46,
  compact = false,
  className = "",
}: {
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`group inline-flex items-center gap-3 ${className}`}>
      <span className="relative inline-flex items-center">
        <span className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-md transition-all duration-500 group-hover:bg-gold/60" />
        <LogoMark size={size} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="gold-text font-display text-[18px] font-bold tracking-[2px] uppercase">
            மயிலோன்
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[4px] text-white/65">
            PYROWORLD
          </span>
        </span>
      )}
    </span>
  );
}
