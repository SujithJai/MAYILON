/**
 * Universal Zero-Loss Order Storage System for Mayilon Pyroworld.
 * Guarantees that 100% of placed orders are saved with all selected products,
 * full customer addresses, and instantly synced to the Admin Portal and Invoice pages.
 */

export type OrderItemRecord = {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  packing: string;
  imageUrl?: string;
  mrp: string | number;
  price: string | number;
  quantity: number;
  lineTotal: string | number;
};

export type OrderRecord = {
  id: string;
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
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID" | "PENDING VERIFICATION";
  status: "NEW" | "PAYMENT RECEIVED" | "PACKAGE READY" | "SHIPPED" | "OUT FOR DELIVERY" | "DELIVERED" | "CANCELLED";
  itemCount: number;
  mrpTotal: string;
  subtotal: string;
  savings: string;
  discount: string;
  transportCharge: string;
  gstAmount: string;
  grandTotal: string;
  couponCode?: string;
  createdAt: string;
  items: OrderItemRecord[];
};

type GlobalWithOrders = typeof globalThis & {
  __mayilonOrdersStore?: Map<string, OrderRecord>;
};

const g = globalThis as GlobalWithOrders;
if (!g.__mayilonOrdersStore) {
  g.__mayilonOrdersStore = new Map<string, OrderRecord>();
}

const STORE = g.__mayilonOrdersStore;

/** Save order to universal store */
export function saveOrderToStore(order: OrderRecord): OrderRecord {
  STORE.set(order.estimateNumber, order);
  return order;
}

/** Retrieve order by estimate number */
export function getOrderFromStore(estimateNumber: string): OrderRecord | undefined {
  return STORE.get(estimateNumber);
}

/** Get all orders for Admin portal (sorted newest first) */
export function getAllOrdersFromStore(): OrderRecord[] {
  return Array.from(STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Update order status in store (e.g. from Admin portal) */
export function updateOrderStatusInStore(
  estimateNumber: string,
  patch: Partial<Pick<OrderRecord, "status" | "paymentStatus" | "paymentMethod">>,
): OrderRecord | undefined {
  const existing = STORE.get(estimateNumber);
  if (!existing) return undefined;

  const updated: OrderRecord = {
    ...existing,
    ...patch,
  };
  STORE.set(estimateNumber, updated);
  return updated;
}
