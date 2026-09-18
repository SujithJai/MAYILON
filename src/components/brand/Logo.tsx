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
      style={className.includes("w-") || className.includes("h-") ? undefined : { width: size, height: size }}
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
    <span className={`group inline-flex items-center gap-2 sm:gap-3 ${className}`}>
      <span className="relative inline-flex items-center shrink-0">
        <span className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-md transition-all duration-500 group-hover:bg-gold/60" />
        <LogoMark size={size} className="h-[36px] w-[36px] sm:h-[44px] sm:w-[44px]" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="gold-text font-display text-[15px] sm:text-[18px] font-bold tracking-[1.5px] sm:tracking-[2px] uppercase">
            மயிலோன்
          </span>
          <span className="text-[8.5px] sm:text-[10px] font-bold uppercase tracking-[2.5px] sm:tracking-[4px] text-slate-800">
            PYROWORLD
          </span>
        </span>
      )}
    </span>
  );
}
