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
import { calculateTotals, extractNumber, formatINR, type EstimateTotals } from "@/lib/estimate";

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
const LS_KEY = "mayilon:estimate:v2";

function sanitizeLine(it: any): EstimateLine {
  const p = extractNumber(it.price, it.offerPrice, it.mrp);
  const m = extractNumber(it.mrp, it.offerPrice, p);
  const q = Math.max(1, extractNumber(it.quantity, 1));
  return {
    ...it,
    id: String(it.id || it.sku || Math.random()),
    sku: String(it.sku || ""),
    slug: String(it.slug || ""),
    name: String(it.name || "Item"),
    categoryName: String(it.categoryName || ""),
    packing: String(it.packing || ""),
    imageUrl: it.imageUrl ? String(it.imageUrl) : null,
    mrp: m,
    price: p,
    moq: extractNumber(it.moq, 1),
    quantity: q,
  };
}

export function EstimateProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EstimateLine[]>([]);
  const [coupon, setCoupon] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 1. Initial Load from localStorage (runs once on mount)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY) || localStorage.getItem("mayilon:estimate:v1");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          items?: any[];
          coupon?: string;
          state?: string;
        };
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          const sanitized = parsed.items.map(sanitizeLine);
          setItems(sanitized);
        }
        if (parsed.coupon) setCoupon(parsed.coupon);
        if (parsed.state) setState(parsed.state);
      }
    } catch (err) {
      console.warn("[EstimateProvider] Error loading cart from localStorage:", err);
    } finally {
      setReady(true);
    }
  }, []);

  // 2. Save to localStorage ONLY AFTER ready is true
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ items, coupon, state }));
    } catch (err) {
      console.warn("[EstimateProvider] Error saving cart to localStorage:", err);
    }
  }, [items, coupon, state, ready]);

  // 3. Auto hide toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // 4. Add item with robust ID & SKU matching
  const add = useCallback<Ctx["add"]>((rawLine, qty) => {
    const line = sanitizeLine(rawLine);
    setItems((prev) => {
      const lineIdStr = String(line.id);
      const found = prev.find(
        (p) => String(p.id) === lineIdStr || (p.sku && line.sku && p.sku === line.sku),
      );
      const step = qty ?? line.moq ?? 1;

      if (found) {
        return prev.map((p) =>
          String(p.id) === lineIdStr || (p.sku && line.sku && p.sku === line.sku)
            ? sanitizeLine({ ...p, quantity: p.quantity + step })
            : p,
        );
      }
      return [...prev, sanitizeLine({ ...line, quantity: step })];
    });
    setToast(`${line.name} added to estimate`);
  }, []);

  // 5. Update quantity
  const setQty = useCallback<Ctx["setQty"]>((id, qty) => {
    const idStr = String(id);
    const numQty = extractNumber(qty, 0);
    setItems((prev) =>
      prev.flatMap((p) =>
        String(p.id) === idStr
          ? numQty <= 0
            ? []
            : [sanitizeLine({ ...p, quantity: numQty })]
          : [p],
      ),
    );
  }, []);

  // 6. Remove item
  const remove = useCallback<Ctx["remove"]>((id) => {
    const idStr = String(id);
    setItems((prev) => prev.filter((p) => String(p.id) !== idStr));
  }, []);

  // 7. Clear cart
  const clear = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem("mayilon:estimate:v1");
    } catch {}
  }, []);

  const totals = useMemo(
    () =>
      calculateTotals(
        items.map((i) => ({
          mrp: extractNumber(i.mrp, (i as any).offerPrice),
          price: extractNumber(i.price, (i as any).offerPrice, i.mrp),
          quantity: extractNumber(i.quantity, 1),
        })),
        {
          state,
          couponCode: coupon,
        },
      ),
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
