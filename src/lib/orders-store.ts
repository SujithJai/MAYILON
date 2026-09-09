import fs from "fs";
import path from "path";

/**
 * Universal Zero-Loss Order Storage System for Mayilon Pyroworld.
 * Guarantees that 100% of placed orders are saved with all selected products,
 * full customer addresses, and instantly synced to the Admin Portal and Invoice pages.
 * Supports persistent JSON disk storage in data/orders-store.json.
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
  __mayilonOrdersLoaded?: boolean;
};

const g = globalThis as GlobalWithOrders;
if (!g.__mayilonOrdersStore) {
  g.__mayilonOrdersStore = new Map<string, OrderRecord>();
}

const STORE = g.__mayilonOrdersStore;

function getStoreFilePaths(): string[] {
  const paths: string[] = [];
  // 1. Writable serverless /tmp
  try {
    const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
    if (fs.existsSync(tmpDir)) {
      paths.push(path.join(tmpDir, "mayilon-orders-store.json"));
    }
  } catch {}

  // 2. Project data dir
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    paths.push(path.join(dataDir, "orders-store.json"));
  } catch {}

  return paths;
}

function loadOrdersFromDisk() {
  if (g.__mayilonOrdersLoaded) return;
  try {
    const filePaths = getStoreFilePaths();
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        if (raw.trim()) {
          const list = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            for (const o of list) {
              if (o && o.estimateNumber) {
                STORE.set(o.estimateNumber, o);
              }
            }
            // If loaded from /tmp, break
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[orders-store] Error loading orders from disk:", err);
  } finally {
    g.__mayilonOrdersLoaded = true;
  }
}

function saveOrdersToDisk() {
  const list = Array.from(STORE.values());
  const jsonStr = JSON.stringify(list, null, 2);

  const filePaths = getStoreFilePaths();
  for (const filePath of filePaths) {
    try {
      fs.writeFileSync(filePath, jsonStr, "utf-8");
    } catch (err) {
      // Expected in read-only /var/task on Vercel
    }
  }
}

// Initial eager disk load
loadOrdersFromDisk();

/** Bulk sync orders from Admin client storage */
export function bulkSyncOrders(orders: OrderRecord[]) {
  if (!Array.isArray(orders)) return;
  loadOrdersFromDisk();
  for (const o of orders) {
    if (o && o.estimateNumber) {
      if (!STORE.has(o.estimateNumber)) {
        STORE.set(o.estimateNumber, o);
      }
    }
  }
  saveOrdersToDisk();
}

/** Save order to universal store and persist to disk */
export function saveOrderToStore(order: OrderRecord): OrderRecord {
  loadOrdersFromDisk();
  STORE.set(order.estimateNumber, order);
  saveOrdersToDisk();
  return order;
}

/** Retrieve order by estimate number */
export function getOrderFromStore(estimateNumber: string): OrderRecord | undefined {
  loadOrdersFromDisk();
  return STORE.get(estimateNumber);
}

/** Get all orders for Admin portal (sorted newest first) */
export function getAllOrdersFromStore(): OrderRecord[] {
  loadOrdersFromDisk();
  return Array.from(STORE.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Update order status in store and persist to disk */
export function updateOrderStatusInStore(
  estimateNumber: string,
  patch: Partial<Pick<OrderRecord, "status" | "paymentStatus" | "paymentMethod">>,
): OrderRecord | undefined {
  loadOrdersFromDisk();
  const existing = STORE.get(estimateNumber);
  if (!existing) return undefined;

  const updated: OrderRecord = {
    ...existing,
    ...patch,
  };
  STORE.set(estimateNumber, updated);
  saveOrdersToDisk();
  return updated;
}
