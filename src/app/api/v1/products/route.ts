import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { getProducts } from "@/lib/data";
import {
  clearAllProductsInStore,
  deleteProductFromStore,
  getFullStoreState,
  getProductOrderFromStore,
  persistProductOrderToDb,
  persistProductsToDb,
  saveProductToStore,
  setProductOrderInStore,
  syncAllProductsState,
  syncStoreWithDb,
  type ProductRecord,
} from "@/lib/products-store";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await syncStoreWithDb().catch(() => null);
  const sp = new URL(req.url).searchParams;
  const num = (k: string) => {
    const v = sp.get(k);
    return v ? Number(v) : undefined;
  };

  const { items, total } = await getProducts({
    category: sp.get("category") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: sp.get("sort") ?? undefined,
    flag: sp.get("flag") ?? undefined,
    min: num("min"),
    max: num("max"),
    limit: num("limit") ?? 250,
    offset: num("offset") ?? 0,
  });

  const productOrder = getProductOrderFromStore();

  return ok({ items, total, productOrder });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "sync_all" && body.state) {
    syncAllProductsState(body.state);
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
    return ok({ state: getFullStoreState() }, "Catalogue state synced successfully", 200);
  }

  if (body.action === "get_snapshot") {
    return ok({ state: getFullStoreState() }, "Full snapshot retrieved", 200);
  }

  if (body.action === "clear-all") {
    clearAllProductsInStore();
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
    return ok({}, "Catalogue cleared successfully", 200);
  }

  if (body.action === "reorder" && Array.isArray(body.order)) {
    const updatedOrder = setProductOrderInStore(body.order);
    await persistProductOrderToDb(body.order).catch(() => null);
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
    return ok({ order: updatedOrder }, "Product sequence updated successfully", 200);
  }

  return saveProductItem(body);
}

async function saveProductItem(body: any) {
  if (!body.name || body.mrp === undefined || body.offerPrice === undefined) {
    return fail("Product name, MRP, and offer price are required", [], 400);
  }

  const id = String(body.id || `prod-${Date.now()}`);
  const name = String(body.name).trim();
  const sku = String(body.sku || `MYL-PROD-${Date.now().toString().slice(-4)}`).trim();
  const slug = slugify(name);
  const mrp = Number(body.mrp) || 100;
  const offerPrice = Number(body.offerPrice) || mrp;

  const productRecord: ProductRecord = {
    id,
    sku,
    slug,
    name,
    nameTa: body.nameTa || undefined,
    categoryName: body.categoryName || "Special Fireworks",
    imageUrl: body.imageUrl || "/images/placeholder.jpg",
    imageUrl2: body.imageUrl2 || undefined,
    imageUrl3: body.imageUrl3 || undefined,
    videoUrl: body.videoUrl || undefined,
    packing: body.packing || "1 Box",
    mrp,
    offerPrice,
    discountPercent: Math.round(((mrp - offerPrice) / mrp) * 100),
    moq: Number(body.moq) || 1,
    stock: Number(body.stock) || 500,
    status: "ACTIVE",
    isFeatured: Boolean(body.isFeatured),
    isNewArrival: Boolean(body.isNewArrival),
    isBestSeller: Boolean(body.isBestSeller),
    isPremium: Boolean(body.isPremium),
    createdAt: body.createdAt || new Date().toISOString(),
  };

  // 1. Save to Universal Product Store (Guaranteed Zero-Loss Disk & Memory Persistence)
  saveProductToStore(productRecord);
  await persistProductsToDb().catch(() => null);

  // 2. Direct PostgreSQL update if database is accessible
  try {
    const { pool } = await import("@/db");
    await pool.query(
      `UPDATE products 
       SET name = $1, mrp = $2, offer_price = $3, packing = $4, stock = $5, image_url = $6, updated_at = NOW()
       WHERE sku = $7 OR id::text = $8 OR slug = $9;`,
      [
        productRecord.name,
        String(productRecord.mrp),
        String(productRecord.offerPrice),
        productRecord.packing,
        productRecord.stock,
        productRecord.imageUrl,
        productRecord.sku,
        productRecord.id,
        productRecord.slug,
      ],
    );
  } catch (sqlErr) {
    console.warn("[saveProductItem] DB direct SQL update note:", sqlErr);
  }

  // 3. Instant Next.js Cache Revalidation
  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
  } catch (revErr) {
    console.warn("[saveProductItem] Revalidation note:", revErr);
  }

  return ok({ product: productRecord }, "Product saved successfully", 200);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "reorder" && Array.isArray(body.order)) {
    const updatedOrder = setProductOrderInStore(body.order);
    await persistProductOrderToDb(body.order).catch(() => null);
    try {
      revalidatePath("/", "layout");
      revalidatePath("/products");
      revalidatePath("/estimate");
    } catch {}
    return ok({ order: updatedOrder }, "Product sequence updated successfully", 200);
  }

  return saveProductItem(body);
}

export async function DELETE(req: Request) {
  const sp = new URL(req.url).searchParams;
  const action = sp.get("action");
  const id = sp.get("id");

  if (action === "clear-all") {
    clearAllProductsInStore();
    await persistProductsToDb().catch(() => null);
    await persistProductOrderToDb([]).catch(() => null);
    try {
      revalidatePath("/", "layout");
      revalidatePath("/products");
      revalidatePath("/estimate");
    } catch {}
    return ok({}, "All catalogue products cleared successfully");
  }

  if (!id) return fail("Product ID required", [], 400);

  deleteProductFromStore(id);
  await persistProductsToDb().catch(() => null);
  await persistProductOrderToDb(getProductOrderFromStore()).catch(() => null);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
  } catch (revErr) {
    console.warn("[DELETE /products] Revalidation note:", revErr);
  }

  return ok({ id }, "Product deleted successfully");
}
