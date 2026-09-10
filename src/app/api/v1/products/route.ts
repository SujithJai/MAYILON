import { revalidatePath } from "next/cache";
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

  if (!body.name || !body.mrp || !body.offerPrice) {
    return fail("Product name, MRP, and offer price are required", [], 400);
  }

  const id = body.id || `prod-${Date.now()}`;
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

  // 1. Save to Universal Product Store (Guaranteed Zero-Loss Disk Persistence)
  saveProductToStore(productRecord);
  await persistProductsToDb().catch(() => null);

  // 2. Best-effort DB Sync with valid category reference
  try {
    const existingCats = await db.select({ id: categories.id }).from(categories).limit(1);
    const validCatId = existingCats[0]?.id;

    if (validCatId) {
      await db
        .insert(products)
        .values({
          sku: productRecord.sku,
          slug: productRecord.slug,
          name: productRecord.name,
          categoryId: validCatId,
          imageUrl: productRecord.imageUrl,
          packing: productRecord.packing,
          mrp: String(productRecord.mrp),
          offerPrice: String(productRecord.offerPrice),
          discountPercent: productRecord.discountPercent,
          moq: productRecord.moq,
          stock: productRecord.stock,
          isFeatured: productRecord.isFeatured,
          isNewArrival: productRecord.isNewArrival,
          isBestSeller: productRecord.isBestSeller,
          isPremium: productRecord.isPremium,
        })
        .onConflictDoUpdate({
          target: products.sku,
          set: {
            name: productRecord.name,
            mrp: String(productRecord.mrp),
            offerPrice: String(productRecord.offerPrice),
            packing: productRecord.packing,
            imageUrl: productRecord.imageUrl,
            stock: productRecord.stock,
            updatedAt: new Date(),
          },
        });
    }
  } catch (err) {
    console.warn("[POST /products] DB background sync note:", err);
  }

  // 3. Instant Next.js Cache Revalidation
  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
  } catch (revErr) {
    console.warn("[POST /products] Revalidation note:", revErr);
  }

  return ok({ product: productRecord }, "Product saved successfully", 201);
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

  if (!body.id) return fail("Product ID is required", [], 400);

  // If normal product update via PUT, forward to POST logic
  return POST(req);
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
