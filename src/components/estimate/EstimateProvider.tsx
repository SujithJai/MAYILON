"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { calculateTotals, formatINR, type EstimateTotals } from "@/lib/estimate";

export type EstimateLine = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  categoryName: string;
  packing: string;
  imageUrl: string | null;
  mrp: number;
  price: number;
  moq: number;
  quantity: number;
};

type Ctx = {
  items: EstimateLine[];
  ready: boolean;
  coupon: string;
  state: string;
  totals: EstimateTotals;
  setCoupon: (v: string) => void;
  setState: (v: string) => void;
  add: (line: Omit<EstimateLine, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const EstimateCtx = createContext<Ctx | null>(null);
const LS_KEY = "mayilon:estimate:v1";

export function EstimateProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EstimateLine[]>([]);
  const [coupon, setCoupon] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          items?: EstimateLine[];
          coupon?: string;
          state?: string;
        };
        setItems(parsed.items ?? []);
        setCoupon(parsed.coupon ?? "");
        setState(parsed.state ?? "Tamil Nadu");
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ items, coupon, state }));
  }, [items, coupon, state, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const add = useCallback<Ctx["add"]>((line, qty) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === line.id);
      const step = qty ?? line.moq ?? 1;
      if (found) {
        return prev.map((p) => (p.id === line.id ? { ...p, quantity: p.quantity + step } : p));
      }
      return [...prev, { ...line, quantity: step }];
    });
    setToast(`${line.name} added to estimate`);
  }, []);

  const setQty = useCallback<Ctx["setQty"]>((id, qty) => {
    setItems((prev) =>
      prev.flatMap((p) => (p.id === id ? (qty <= 0 ? [] : [{ ...p, quantity: qty }]) : [p])),
    );
  }, []);

  const remove = useCallback<Ctx["remove"]>((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(
    () => calculateTotals(items.map((i) => ({ mrp: i.mrp, price: i.price, quantity: i.quantity })), {
      state,
      couponCode: coupon,
    }),
    [items, state, coupon],
  );

  const value = useMemo<Ctx>(
    () => ({ items, ready, coupon, state, totals, setCoupon, setState, add, setQty, remove, clear }),
    [items, ready, coupon, state, totals, add, setQty, remove, clear],
  );

  return (
    <EstimateCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark fixed bottom-24 left-1/2 z-[500] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm shadow-2xl md:bottom-8"
          >
            <span className="mr-2 text-gold">✦</span>
            {toast}
            <span className="ml-3 text-white/50">{formatINR(totals.subtotal)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </EstimateCtx.Provider>
  );
}

export function useEstimate() {
  const ctx = useContext(EstimateCtx);
  if (!ctx) throw new Error("useEstimate must be used inside EstimateProvider");
  return ctx;
}
