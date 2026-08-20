export const MIN_ORDER_RULES: Record<string, number> = {
  "Tamil Nadu": 3000,
  Puducherry: 3000,
  DEFAULT: 5000,
};

export const STATES = [
  "Tamil Nadu",
  "Puducherry",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Gujarat",
  "Delhi",
  "Rajasthan",
  "West Bengal",
  "Odisha",
  "Other",
];

export const COUPONS: Record<string, { label: string; percent: number; minValue: number }> = {
  DEEPAVALI10: { label: "Festival Offer — 10% off", percent: 10, minValue: 5000 },
  DEALER15: { label: "Dealer Advantage — 15% off", percent: 15, minValue: 25000 },
  BULK20: { label: "Bulk Buyer — 20% off", percent: 20, minValue: 75000 },
};

export function minOrderFor(state?: string | null): number {
  if (!state) return MIN_ORDER_RULES.DEFAULT;
  return MIN_ORDER_RULES[state] ?? MIN_ORDER_RULES.DEFAULT;
}

export type CalcLine = {
  mrp: number;
  price: number;
  quantity: number;
};

export type EstimateTotals = {
  itemCount: number;
  units: number;
  mrpTotal: number;
  subtotal: number;
  savings: number;
  discount: number;
  transportCharge: number;
  gstAmount: number;
  grandTotal: number;
  couponLabel: string | null;
};

/**
 * Single source of truth for estimate money math. Used on the client for live
 * preview and re-run on the server at submit time so totals can never be faked.
 */
export function calculateTotals(
  lines: CalcLine[],
  opts: { state?: string | null; couponCode?: string | null } = {},
): EstimateTotals {
  const safeLines = (lines || []).map((l) => ({
    mrp: Number(l.mrp) || 0,
    price: Number(l.price) || 0,
    quantity: Number(l.quantity) || 0,
  }));

  const mrpTotal = round(safeLines.reduce((s, l) => s + l.mrp * l.quantity, 0));
  const subtotal = round(safeLines.reduce((s, l) => s + l.price * l.quantity, 0));
  const units = safeLines.reduce((s, l) => s + l.quantity, 0);

  const code = opts.couponCode?.trim().toUpperCase() ?? "";
  const coupon = COUPONS[code];
  const couponValid = Boolean(coupon && subtotal >= coupon.minValue);
  const discount = couponValid && coupon ? round((subtotal * coupon.percent) / 100) : 0;

  const netAfterDiscount = Math.max(0, subtotal - discount);
  // Transport: free above ₹50,000, otherwise ~3.5% of net capped at ₹2,400 (min ₹250)
  const transportCharge =
    netAfterDiscount <= 0
      ? 0
      : netAfterDiscount >= 50000
        ? 0
        : Math.min(2400, Math.max(250, round(netAfterDiscount * 0.035)));

  const gstAmount = round(netAfterDiscount * 0.18);
  const grandTotal = round(netAfterDiscount + transportCharge + gstAmount);

  return {
    itemCount: safeLines.length,
    units,
    mrpTotal: isNaN(mrpTotal) ? 0 : mrpTotal,
    subtotal: isNaN(subtotal) ? 0 : subtotal,
    savings: isNaN(mrpTotal - subtotal + discount) ? 0 : round(mrpTotal - subtotal + discount),
    discount: isNaN(discount) ? 0 : discount,
    transportCharge: isNaN(transportCharge) ? 0 : transportCharge,
    gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
    grandTotal: isNaN(grandTotal) ? 0 : grandTotal,
    couponLabel: couponValid && coupon ? coupon.label : null,
  };
}

function round(n: number) {
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatINR(value: number, opts: { compact?: boolean } = {}) {
  const num = Number(value);
  if (isNaN(num) || num === null || num === undefined) {
    return "₹0";
  }
  if (opts.compact && num >= 100000) {
    return `₹${(num / 100000).toFixed(num >= 1000000 ? 1 : 2)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function makeEstimateNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 899999);
  return `MYL-${y}${m}-${rand}`;
}
