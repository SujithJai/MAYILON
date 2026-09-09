import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, zodFail } from "@/lib/api";
import {
  deleteProductFromStore,
  getProductOrderFromStore,
  saveProductToStore,
  setProductOrderInStore,
  type ProductRecord,
} from "@/lib/products-store";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  sku: z.string().min(2),
  categoryName: z.string().min(2),
  mrp: z.number().or(z.string()),
  offerPrice: z.number().or(z.string()),
  packing: z.string().min(1),
  moq: z.number().default(1),
  stock: z.number().default(100),
  imageUrl: z.string().nullable().optional(),
  imageUrl2: z.string().nullable().optional(),
  imageUrl3: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  soundLevel: z.string().optional(),
  burnTime: z.string().optional(),
});

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const raw = await req.json().catch(() => ({}));

  if (raw.action === "reorder" && Array.isArray(raw.order)) {
    const updated = setProductOrderInStore(raw.order);
    try {
      revalidatePath("/", "layout");
      revalidatePath("/products");
      revalidatePath("/estimate");
    } catch {}
    return ok({ order: updated }, "Product sequence updated successfully");
  }

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const mrp = Number(data.mrp) || 100;
  const offerPrice = Number(data.offerPrice) || mrp;
  const id = data.id || `prod-${Date.now()}`;
  const name = data.name.trim();
  const sku = data.sku.trim();

  const newProduct: ProductRecord = {
    id,
    sku,
    slug: slugify(name),
    name,
    categoryName: data.categoryName,
    mrp,
    offerPrice,
    discountPercent: Math.round(((mrp - offerPrice) / mrp) * 100),
    packing: data.packing,
    moq: Number(data.moq) || 1,
    stock: Number(data.stock) || 100,
    imageUrl: data.imageUrl || "/images/placeholder.jpg",
    imageUrl2: data.imageUrl2 || undefined,
    imageUrl3: data.imageUrl3 || undefined,
    videoUrl: data.videoUrl || undefined,
    isNewArrival: Boolean(data.isNewArrival),
    isBestSeller: Boolean(data.isBestSeller),
    isPremium: Boolean(data.isPremium),
    soundLevel: data.soundLevel,
    burnTime: data.burnTime,
    createdAt: new Date().toISOString(),
    status: "ACTIVE",
  };

  saveProductToStore(newProduct);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
  } catch (err) {
    console.warn("[Admin Product POST] Revalidation note:", err);
  }

  return ok({ product: newProduct }, "Product saved successfully");
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  if (!id) return fail("Product ID required", [], 400);

  deleteProductFromStore(id);

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products");
    revalidatePath("/estimate");
  } catch {}

  return ok({ id }, "Product deleted successfully");
}
