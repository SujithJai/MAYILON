import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div
      className={`mb-7 sm:mb-12 flex flex-col gap-3 sm:gap-4 ${
        centered ? "items-center text-center" : "items-start md:flex-row md:items-end md:justify-between"
      }`}
    >
      <Reveal className={centered ? "flex flex-col items-center" : ""}>
        {eyebrow && (
          <span className="mb-2 sm:mb-3 inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[3px] sm:tracking-[4px] text-red-600">
            <span className="h-px w-5 sm:w-6 bg-red-600/60" />
            {eyebrow}
            {centered && <span className="h-px w-5 sm:w-6 bg-red-600/60" />}
          </span>
        )}
        <h2 className="max-w-3xl font-display text-[24px] sm:text-[32px] md:text-[42px] font-bold leading-[1.15] text-balance text-slate-900">
          {title}
        </h2>
        {sub && (
          <p className={`mt-2 sm:mt-3.5 max-w-2xl text-[13px] sm:text-[15px] leading-relaxed text-slate-600 font-medium ${centered ? "" : ""}`}>
            {sub}
          </p>
        )}
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}
