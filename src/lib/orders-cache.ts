/**
 * In-memory fallback cache for orders so client estimate confirmation pages
 * always display the exact customer data & items even before DB sync.
 */

type OrderCacheRecord = {
  estimateNumber: string;
  customerName: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  city: string;
  pincode: string;
  address: string;
  gstNumber?: string;
  dealerName?: string;
  transportName?: string;
  deliveryLocation?: string;
  instructions?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status: string;
  mrpTotal: string;
  subtotal: string;
  savings: string;
  discount: string;
  transportCharge: string;
  gstAmount: string;
  grandTotal: string;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    categoryName: string;
    packing: string;
    sku: string;
    imageUrl?: string;
    mrp: string;
    price: string;
    quantity: number;
    lineTotal: string;
  }[];
};

const g = globalThis as unknown as { __orderCache?: Map<string, OrderCacheRecord> };
if (!g.__orderCache) {
  g.__orderCache = new Map<string, OrderCacheRecord>();
}

export const ORDER_CACHE = g.__orderCache;

export function saveOrderToCache(record: OrderCacheRecord) {
  ORDER_CACHE.set(record.estimateNumber, record);
}

export function getOrderFromCache(estimateNumber: string): OrderCacheRecord | undefined {
  return ORDER_CACHE.get(estimateNumber);
}
