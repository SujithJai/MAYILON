import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/data";
import { SITE } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticRoutes = ["", "/products", "/categories", "/about", "/safety", "/contact", "/dealers", "/estimate", "/track", "/legal"];

  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  try {
    [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);
  } catch {
    // database not reachable during build — fall back to static routes
  }

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: r === "" ? 1 : 0.8,
    })),
    ...categories.map((c) => ({
      url: `${base}/products?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
