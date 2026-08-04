import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center text-center">
      <LogoMark size={90} />
      <h1 className="mt-8 font-display text-[64px] font-bold leading-none gold-text">404</h1>
      <p className="mt-4 font-display text-2xl text-white">This fuse led nowhere</p>
      <p className="mt-3 max-w-md text-[14px] text-white/50">
        The page you were looking for has been moved, renamed, or never existed. Let&apos;s get you
        back to the fireworks.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-gold px-7 py-3.5 text-sm uppercase">
          Back home
        </Link>
        <Link href="/products" className="btn-ghost px-7 py-3.5 text-sm uppercase">
          Browse products
        </Link>
      </div>
    </div>
  );
}
