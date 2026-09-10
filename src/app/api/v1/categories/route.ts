import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { getCategories, getProducts } from "@/lib/data";
import {
  persistCategoriesToDb,
  persistProductsToDb,
  saveCustomCategoryToStore,
  syncCategoriesWithDb,
  saveProductToStore,
  syncStoreWithDb,
  getFullStoreState,
  type CustomCategory,
} from "@/lib/products-store";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  await syncCategoriesWithDb().catch(() => null);
  await syncStoreWithDb().catch(() => null);
  const items = await getCategories();
  const prods = await getProducts({ limit: 500 }).catch(() => ({ items: [] }));
  
  // Real-time product counts per category
  const countMap = new Map<string, number>();
  prods.items.forEach((p) => {
    const cName = (p.categoryName || "Special Fireworks").trim().toUpperCase();
    countMap.set(cName, (countMap.get(cName) || 0) + 1);
  });

  const updatedItems = items.map((c) => ({
    ...c,
    productCount: countMap.get(c.name.trim().toUpperCase()) || c.productCount || 0,
  }));

  return ok({ items: updatedItems, total: updatedItems.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawName = String(body.name || "").trim();
    if (!rawName) {
      return fail("Category name is required", [], 400);
    }

    const name = rawName.toUpperCase();
    const slug = slugify(name);
    const catId = body.id || `cat-${Date.now()}`;

    const newCategory: CustomCategory = {
      id: catId,
      name,
      nameTa: body.nameTa ? String(body.nameTa).trim() : null,
      slug,
      tagline: body.tagline || null,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      accent: body.accent || "#D4AF37",
      icon: body.icon || "sparkles",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 99,
      productCount: Array.isArray(body.productIds) ? body.productIds.length : 0,
    };

    saveCustomCategoryToStore(newCategory);
    await persistCategoriesToDb();

    // Also attempt PostgreSQL insert into categories table
    try {
      await db
        .insert(categories)
        .values({
          id: catId,
          name: newCategory.name,
          nameTa: newCategory.nameTa,
          slug: newCategory.slug,
          tagline: newCategory.tagline,
          description: newCategory.description,
          imageUrl: newCategory.imageUrl,
          accent: newCategory.accent,
          icon: newCategory.icon,
          sortOrder: newCategory.sortOrder,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: newCategory.name,
            updatedAt: new Date(),
          },
        });
    } catch (dbErr) {
      console.warn("[POST /categories] DB direct insert note:", dbErr);
    }

    // If initial products are assigned to this category
    if (Array.isArray(body.productIds) && body.productIds.length > 0) {
      const pIds = new Set(body.productIds.map(String));
      const full = getFullStoreState();
      for (const p of full.products) {
        if (pIds.has(p.id) || pIds.has(p.sku)) {
          p.categoryName = newCategory.name;
          p.categoryId = newCategory.id;
          saveProductToStore(p);

          // Update in DB if reachable
          try {
            await db
              .update(products)
              .set({ categoryId: newCategory.id, updatedAt: new Date() })
              .where(or(eq(products.id, p.id), eq(products.sku, p.sku)));
          } catch {}
        }
      }
      await persistProductsToDb();
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/estimate");
    } catch {}

    return ok(newCategory);
  } catch (err: any) {
    console.error("[POST /categories] Error:", err);
    return fail(err?.message || "Failed to create category", [], 500);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const oldName = String(body.oldName || "").trim().toUpperCase();
    const newName = String(body.name || "").trim().toUpperCase();
    if (!newName) {
      return fail("New category name is required", [], 400);
    }

    const slug = slugify(newName);
    const catId = body.id || `cat-${Date.now()}`;

    const updatedCat: CustomCategory = {
      id: catId,
      name: newName,
      nameTa: body.nameTa ? String(body.nameTa).trim() : null,
      slug,
      tagline: body.tagline || null,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      accent: body.accent || "#D4AF37",
      icon: body.icon || "sparkles",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 99,
    };

    saveCustomCategoryToStore(updatedCat);
    await persistCategoriesToDb();

    // Update all products belonging to oldName or productIds list
    const pIds = Array.isArray(body.productIds) ? new Set(body.productIds.map(String)) : null;
    const full = getFullStoreState();
    let prodsChanged = false;

    for (const p of full.products) {
      const matchOld = oldName && p.categoryName?.trim().toUpperCase() === oldName;
      const matchIds = pIds && (pIds.has(p.id) || pIds.has(p.sku));
      if (matchOld || matchIds) {
        p.categoryName = newName;
        p.categoryId = catId;
        saveProductToStore(p);
        prodsChanged = true;

        try {
          await db
            .update(products)
            .set({ categoryId: catId, updatedAt: new Date() })
            .where(or(eq(products.id, p.id), eq(products.sku, p.sku)));
        } catch {}
      }
    }

    if (prodsChanged) {
      await persistProductsToDb();
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/estimate");
    } catch {}

    return ok(updatedCat);
  } catch (err: any) {
    console.error("[PUT /categories] Error:", err);
    return fail(err?.message || "Failed to update category", [], 500);
  }
}
