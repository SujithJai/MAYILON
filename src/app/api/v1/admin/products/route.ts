import { z } from "zod";
import { fail, ok, requireAdmin, zodFail } from "@/lib/api";
import { getCategories, getProducts } from "@/lib/data";

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
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const parsed = productSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const newProduct = {
    id: data.id || `prod-${Date.now()}`,
    sku: data.sku,
    name: data.name,
    categoryName: data.categoryName,
    mrp: Number(data.mrp),
    offerPrice: Number(data.offerPrice),
    discountPercent: Math.round(((Number(data.mrp) - Number(data.offerPrice)) / Number(data.mrp)) * 100),
    packing: data.packing,
    moq: Number(data.moq),
    stock: Number(data.stock),
    imageUrl: data.imageUrl || "/images/placeholder.jpg",
    isNewArrival: Boolean(data.isNewArrival),
    isBestSeller: Boolean(data.isBestSeller),
    isPremium: Boolean(data.isPremium),
  };

  return ok({ product: newProduct }, "Product created successfully");
}

export async function PUT(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  if (!body.id) return fail("Product ID required", [], 400);

  return ok({ product: body }, "Product updated successfully");
}
