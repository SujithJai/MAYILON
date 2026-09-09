import fs from "fs";
import path from "path";

/**
 * Universal Product Store & Clean Catalogue Engine for Mayilon Pyroworld.
 * Supports persistent JSON disk storage, custom product reordering,
 * and zero-downtime memory cache.
 */

export type ProductRecord = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  nameTa?: string;
  categoryId?: string;
  categoryName: string;
  shortDescription?: string;
  description?: string;
  imageUrl: string;
  imageUrl2?: string;
  imageUrl3?: string;
  videoUrl?: string;
  packing: string;
  piecesPerPack?: number;
  mrp: number;
  offerPrice: number;
  dealerPrice?: number;
  discountPercent?: number;
  gstPercent?: number;
  moq: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
  soundLevel?: string;
  burnTime?: string;
  createdAt: string;
};

type StoredData = {
  products: ProductRecord[];
  productOrder: string[];
  seedCleared: boolean;
  deletedIds: string[];
};

type GlobalWithProducts = typeof globalThis & {
  __mayilonCustomProductsStore?: Map<string, ProductRecord>;
  __mayilonClearSeedMode?: boolean;
  __mayilonDeletedProductIds?: Set<string>;
  __mayilonProductOrder?: string[];
  __mayilonStoreLoaded?: boolean;
};

const g = globalThis as GlobalWithProducts;
if (!g.__mayilonCustomProductsStore) {
  g.__mayilonCustomProductsStore = new Map<string, ProductRecord>();
}
if (g.__mayilonClearSeedMode === undefined) {
  g.__mayilonClearSeedMode = false;
}
if (!g.__mayilonDeletedProductIds) {
  g.__mayilonDeletedProductIds = new Set<string>();
}
if (!g.__mayilonProductOrder) {
  g.__mayilonProductOrder = [];
}

const STORE = g.__mayilonCustomProductsStore;
const DELETED_SET = g.__mayilonDeletedProductIds;

function getStoreFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
      console.warn("[products-store] Unable to create data dir:", err);
    }
  }
  return path.join(dataDir, "products-store.json");
}

function loadFromDisk() {
  if (g.__mayilonStoreLoaded) return;
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      if (raw.trim()) {
        const data = JSON.parse(raw) as StoredData;
        if (Array.isArray(data.products)) {
          for (const p of data.products) {
            if (p && p.id) STORE.set(p.id, p);
          }
        }
        if (Array.isArray(data.productOrder)) {
          g.__mayilonProductOrder = data.productOrder;
        }
        if (data.seedCleared !== undefined) {
          g.__mayilonClearSeedMode = Boolean(data.seedCleared);
        }
        if (Array.isArray(data.deletedIds)) {
          for (const d of data.deletedIds) {
            DELETED_SET.add(d);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[products-store] Error loading from disk:", err);
  } finally {
    g.__mayilonStoreLoaded = true;
  }
}

function saveToDisk() {
  try {
    const filePath = getStoreFilePath();
    const data: StoredData = {
      products: Array.from(STORE.values()),
      productOrder: g.__mayilonProductOrder || [],
      seedCleared: Boolean(g.__mayilonClearSeedMode),
      deletedIds: Array.from(DELETED_SET),
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[products-store] Error saving to disk:", err);
  }
}

// Initial eager disk load
loadFromDisk();

/** Save custom product to memory store and persist to disk */
export function saveProductToStore(prod: ProductRecord): ProductRecord {
  loadFromDisk();
  DELETED_SET.delete(prod.id);
  STORE.set(prod.id, prod);
  
  // If product is newly added and not in order, prepend to front
  if (!g.__mayilonProductOrder?.includes(prod.id)) {
    g.__mayilonProductOrder = [prod.id, ...(g.__mayilonProductOrder || [])];
  }
  
  saveToDisk();
  return prod;
}

/** Get all custom added products */
export function getCustomProductsFromStore(): ProductRecord[] {
  loadFromDisk();
  return Array.from(STORE.values());
}

/** Remove individual product from store and persist */
export function deleteProductFromStore(id: string): boolean {
  loadFromDisk();
  DELETED_SET.add(id);
  const deleted = STORE.delete(id);
  if (g.__mayilonProductOrder) {
    g.__mayilonProductOrder = g.__mayilonProductOrder.filter((item) => item !== id);
  }
  saveToDisk();
  return deleted;
}

/** Set custom product display sequence */
export function setProductOrderInStore(orderIds: string[]): string[] {
  loadFromDisk();
  g.__mayilonProductOrder = Array.from(new Set(orderIds.filter(Boolean)));
  saveToDisk();
  return g.__mayilonProductOrder;
}

/** Get custom product display sequence */
export function getProductOrderFromStore(): string[] {
  loadFromDisk();
  return g.__mayilonProductOrder || [];
}

/** Check if seed products are cleared */
export function isSeedCleared(): boolean {
  loadFromDisk();
  return g.__mayilonClearSeedMode ?? false;
}

/** Set clear seed mode flag and persist */
export function setSeedCleared(cleared: boolean): void {
  loadFromDisk();
  g.__mayilonClearSeedMode = cleared;
  saveToDisk();
}

/** Get set of deleted product IDs */
export function getDeletedProductIds(): Set<string> {
  loadFromDisk();
  return DELETED_SET;
}

/** Clear all products completely from store */
export function clearAllProductsInStore(): void {
  STORE.clear();
  g.__mayilonClearSeedMode = true;
  g.__mayilonProductOrder = [];
  saveToDisk();
}
