"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function TrackPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/v1/estimates/${encodeURIComponent(ref.trim().toUpperCase())}`);
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError("No estimate found with that reference number.");
      return;
    }
    router.push(`/estimate/${json.data.estimate.estimateNumber}`);
  }

  return (
    <div className="shell py-10">
      <nav className="flex items-center gap-2 text-[12px] text-white/40">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="text-gold/50">/</span>
        <span className="text-gold">Track Estimate</span>
      </nav>

      <div className="glass mx-auto mt-16 max-w-xl rounded-[30px] p-10 text-center">
        <h1 className="font-display text-[30px] font-bold leading-tight">
          Track your <span className="gold-text">estimate</span>
        </h1>
        <p className="mt-3 text-[14px] text-white/55">
          Enter the reference number from your confirmation (format MYL-YYMM-XXXXXX).
        </p>
        <form onSubmit={lookup} className="mt-8">
          <div className="relative">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
            <input
              className="field pl-11 uppercase tracking-[2px]"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="MYL-2601-123456"
            />
          </div>
          {error && <p className="mt-3 text-[13px] text-ember">{error}</p>}
          <button disabled={busy} className="btn-gold mt-5 w-full py-3.5 text-sm uppercase disabled:opacity-50">
            {busy ? "Searching…" : "Track estimate"}
          </button>
        </form>
      </div>
    </div>
  );
}
