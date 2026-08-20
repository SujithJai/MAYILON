/**
 * Universal Product Store & Persistence Engine for Mayilon Pyroworld.
 * Ensures newly added or edited products by Admin NEVER disappear on refresh
 * and immediately appear across the entire storefront catalogue.
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

type GlobalWithProducts = typeof globalThis & {
  __mayilonCustomProductsStore?: Map<string, ProductRecord>;
};

const g = globalThis as GlobalWithProducts;
if (!g.__mayilonCustomProductsStore) {
  g.__mayilonCustomProductsStore = new Map<string, ProductRecord>();
}

const STORE = g.__mayilonCustomProductsStore;

/** Save custom product to memory store */
export function saveProductToStore(prod: ProductRecord): ProductRecord {
  STORE.set(prod.id, prod);
  return prod;
}

/** Get all custom added products */
export function getCustomProductsFromStore(): ProductRecord[] {
  return Array.from(STORE.values());
}

/** Remove product from store */
export function deleteProductFromStore(id: string): boolean {
  return STORE.delete(id);
}
