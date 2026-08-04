type Props = {
  size?: number;
  className?: string;
  mono?: boolean;
};

/** Mayilon emblem — peacock feather + vel (spear) + burst inside a gold ring. */
export function LogoMark({ size = 46, className = "", mono = false }: Props) {
  const gold = mono ? "#D4AF37" : undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Mayilon Crackers emblem"
    >
      <defs>
        <linearGradient id="myl-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7E7A8" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="62%" stopColor="#8A6714" />
          <stop offset="100%" stopColor="#F0D57C" />
        </linearGradient>
        <linearGradient id="myl-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B9BFF" />
          <stop offset="100%" stopColor="#0057FF" />
        </linearGradient>
        <radialGradient id="myl-core" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFF7DA" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="47" fill="#050505" stroke="url(#myl-gold)" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="url(#myl-gold)" strokeWidth="0.7" opacity="0.55" />
      <circle cx="50" cy="50" r="26" fill="url(#myl-core)" opacity="0.65" />

      {/* burst rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const x1 = 50 + Math.cos(a) * 29;
        const y1 = 50 + Math.sin(a) * 29;
        const x2 = 50 + Math.cos(a) * 37;
        const y2 = 50 + Math.sin(a) * 37;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#myl-gold)"
            strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
            strokeLinecap="round"
            opacity={i % 3 === 0 ? 0.95 : 0.55}
          />
        );
      })}

      {/* vel / spear */}
      <path
        d="M50 20 L55.5 34 L50 39 L44.5 34 Z"
        fill="url(#myl-gold)"
      />
      <rect x="48.8" y="38" width="2.4" height="34" rx="1.2" fill="url(#myl-gold)" />

      {/* peacock feather eye */}
      <ellipse cx="50" cy="55" rx="13" ry="15" fill={gold ?? "url(#myl-blue)"} opacity={mono ? 0.35 : 0.9} />
      <ellipse cx="50" cy="55" rx="8" ry="9.6" fill="#04122E" opacity={mono ? 0.5 : 1} />
      <ellipse cx="50" cy="55" rx="4.2" ry="5" fill="url(#myl-gold)" />
      <circle cx="50" cy="54" r="1.6" fill="#FFF7DA" />
      <path
        d="M37 60 Q30 70 34 79 M63 60 Q70 70 66 79"
        stroke="url(#myl-gold)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

export function LogoLockup({
  size = 44,
  compact = false,
  className = "",
}: {
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`group inline-flex items-center gap-3 ${className}`}>
      <span className="relative inline-flex">
        <span className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-xl transition-all duration-700 group-hover:bg-gold/60" />
        <LogoMark size={size} className="transition-transform duration-700 group-hover:rotate-[8deg]" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="gold-text font-display text-[17px] font-bold tracking-[2px] uppercase">
            Mayilon
          </span>
          <span className="text-[9.5px] font-medium uppercase tracking-[4.4px] text-white/55">
            Crackers
          </span>
        </span>
      )}
    </span>
  );
}
