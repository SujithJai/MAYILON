import { getCategories, getProducts } from "@/lib/data";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return ok({ products: [], categories: [] });

  const [{ items }, cats] = await Promise.all([getProducts({ q, limit: 8 }), getCategories()]);
  const lower = q.toLowerCase();

  return ok({
    products: items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      mrp: p.mrp,
      offerPrice: p.offerPrice,
      imageUrl: p.imageUrl,
      categoryName: p.categoryName,
    })),
    categories: cats
      .filter((c) => c.name.toLowerCase().includes(lower))
      .map((c) => ({ name: c.name, slug: c.slug })),
  });
}
