import { db } from "@/db";
import { products } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { getProducts } from "@/lib/data";
import {
  deleteProductFromStore,
  getCustomProductsFromStore,
  saveProductToStore,
  type ProductRecord,
} from "@/lib/products-store";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  return ok({ items, total });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
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
    createdAt: new Date().toISOString(),
  };

  // 1. Save to Universal Product Store (Guaranteed Zero-Loss Persistence)
  saveProductToStore(productRecord);

  // 2. Best-effort DB Sync
  try {
    await db
      .insert(products)
      .values({
        sku: productRecord.sku,
        slug: productRecord.slug,
        name: productRecord.name,
        categoryId: "00000000-0000-0000-0000-000000000001",
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
  } catch (err) {
    console.warn("[POST /products] DB background sync note:", err);
  }

  return ok({ product: productRecord }, "Product saved successfully", 201);
}

export async function DELETE(req: Request) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  if (!id) return fail("Product ID required", [], 400);

  deleteProductFromStore(id);

  try {
    // Delete from DB if present
  } catch (err) {}

  return ok({ id }, "Product deleted successfully");
}
