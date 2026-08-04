import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, reviews } from "@/db/schema";
import { IMAGE_POOL, SEED_CATEGORIES, SEED_PRODUCTS, SEED_REVIEWS } from "./seed-data";
import { slugify } from "./slug";

type Seedable = typeof globalThis & { __mayilonSeed?: Promise<void> };

const CATEGORY_CODE: Record<string, string> = {
  "sky-shots": "SKY",
  rockets: "RKT",
  "flower-pots": "FLP",
  "ground-chakkar": "GCK",
  sparklers: "SPK",
  "fancy-novelty": "FNC",
  "single-sound": "SND",
  "gift-boxes": "GFT",
  "kids-special": "KID",
  "wedding-events": "WED",
};

const EFFECTS = ["Gold", "Red", "Blue", "Green", "Silver", "Purple"];

export type ProductWithCategory = typeof products.$inferSelect & {
  categoryName: string;
  categorySlug: string;
  categoryAccent: string;
};

/* ------------------------------------------------------------------ */
/* In-Memory Fallbacks for zero-downtime deployment                   */
/* ------------------------------------------------------------------ */

function getInMemoryCategories() {
  return SEED_CATEGORIES.map((c, i) => ({
    id: `cat-${i + 1}`,
    name: c.name,
    nameTa: c.nameTa,
    slug: c.slug,
    tagline: c.tagline,
    description: c.description,
    imageUrl: c.imageUrl,
    accent: c.accent,
    icon: c.icon,
    sortOrder: i,
    productCount: (SEED_PRODUCTS[c.slug] ?? []).length,
  }));
}

function getInMemoryProducts(): ProductWithCategory[] {
  const cats = getInMemoryCategories();
  const catMap = new Map(cats.map((c) => [c.slug, c]));
  let n = 0;
  const list: ProductWithCategory[] = [];

  for (const [catSlug, rows] of Object.entries(SEED_PRODUCTS)) {
    const cat = catMap.get(catSlug);
    if (!cat) continue;
    rows.forEach((row, idx) => {
      const [name, mrp, packing, pieces, flags = ""] = row;
      const discount = 78 + ((n * 3) % 10);
      const offer = Math.round((mrp * (100 - discount)) / 100);
      const img = IMAGE_POOL[n % IMAGE_POOL.length];
      list.push({
        id: `prod-${n + 1}`,
        sku: `MYL-${CATEGORY_CODE[catSlug] ?? "GEN"}-${`${idx + 1}`.padStart(2, "0")}`,
        slug: slugify(name),
        name,
        nameTa: null,
        categoryId: cat.id,
        shortDescription: `${name} — factory-direct Sivakasi quality with ${discount}% off MRP.`,
        description: `${name} is manufactured at our Sivakasi unit under PESO licence with high-purity chemical composition and precision-rolled casings. Each ${packing.toLowerCase()} is quality checked for fuse integrity, moisture protection and consistent performance. Ideal for Deepavali, temple festivals, weddings, new year and corporate celebrations.`,
        imageUrl: img,
        gallery: [
          img,
          IMAGE_POOL[(n + 3) % IMAGE_POOL.length],
          IMAGE_POOL[(n + 6) % IMAGE_POOL.length],
          IMAGE_POOL[(n + 8) % IMAGE_POOL.length],
        ],
        videoUrl: null,
        packing,
        piecesPerPack: pieces,
        mrp: mrp.toFixed(2),
        discountPercent: discount,
        offerPrice: offer.toFixed(2),
        dealerPrice: Math.round(offer * 0.88).toFixed(2),
        gstPercent: 18,
        moq: mrp > 5000 ? 1 : mrp > 1000 ? 2 : 5,
        stock: 120 + ((n * 37) % 900),
        status: "ACTIVE",
        isFeatured: flags.includes("F"),
        isBestSeller: flags.includes("B"),
        isNewArrival: flags.includes("N"),
        isPremium: flags.includes("P"),
        soundLevel:
          catSlug === "single-sound" ? "High" : catSlug === "kids-special" ? "Very Low" : "Medium",
        burnTime: `${15 + ((n * 7) % 60)} sec`,
        effectColors: [EFFECTS[n % 6], EFFECTS[(n + 2) % 6], EFFECTS[(n + 4) % 6]],
        ageRecommendation: "12+ with adult supervision",
        usage: "Outdoor",
        rating: (4.4 + ((n % 6) * 0.1)).toFixed(2),
        reviewCount: 18 + ((n * 13) % 240),
        viewCount: 400 + ((n * 91) % 5000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        categoryName: cat.name,
        categorySlug: cat.slug,
        categoryAccent: cat.accent,
      });
      n += 1;
    });
  }
  return list;
}

function getInMemoryReviews() {
  const prods = getInMemoryProducts();
  return SEED_REVIEWS.map((r, i) => ({
    id: `rev-${i + 1}`,
    productId: prods[i * 4]?.id ?? prods[i]?.id ?? null,
    name: r.name,
    location: r.location,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerified: true,
    isPublished: true,
    createdAt: new Date(),
  }));
}

/* ------------------------------------------------------------------ */
/* Database Seed                                                       */
/* ------------------------------------------------------------------ */

async function seed() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(categories);
    if (count > 0) return;

    const inserted = await db
      .insert(categories)
      .values(
        SEED_CATEGORIES.map((c, i) => ({
          name: c.name,
          nameTa: c.nameTa,
          slug: c.slug,
          tagline: c.tagline,
          description: c.description,
          imageUrl: c.imageUrl,
          accent: c.accent,
          icon: c.icon,
          sortOrder: i,
        })),
      )
      .onConflictDoNothing()
      .returning();

    const bySlug = new Map(inserted.map((c) => [c.slug, c.id]));
    let n = 0;
    const productRows: (typeof products.$inferInsert)[] = [];

    for (const [catSlug, rows] of Object.entries(SEED_PRODUCTS)) {
      const categoryId = bySlug.get(catSlug);
      if (!categoryId) continue;
      rows.forEach((row, idx) => {
        const [name, mrp, packing, pieces, flags = ""] = row;
        const discount = 78 + ((n * 3) % 10);
        const offer = Math.round((mrp * (100 - discount)) / 100);
        const img = IMAGE_POOL[n % IMAGE_POOL.length];
        productRows.push({
          sku: `MYL-${CATEGORY_CODE[catSlug] ?? "GEN"}-${`${idx + 1}`.padStart(2, "0")}`,
          slug: slugify(name),
          name,
          categoryId,
          shortDescription: `${name} — factory-direct Sivakasi quality with ${discount}% off MRP.`,
          description: `${name} is manufactured at our Sivakasi unit under PESO licence with high-purity chemical composition and precision-rolled casings. Each ${packing.toLowerCase()} is quality checked for fuse integrity, moisture protection and consistent performance. Ideal for Deepavali, temple festivals, weddings, new year and corporate celebrations.`,
          imageUrl: img,
          gallery: [
            img,
            IMAGE_POOL[(n + 3) % IMAGE_POOL.length],
            IMAGE_POOL[(n + 6) % IMAGE_POOL.length],
            IMAGE_POOL[(n + 8) % IMAGE_POOL.length],
          ],
          packing,
          piecesPerPack: pieces,
          mrp: mrp.toFixed(2),
          discountPercent: discount,
          offerPrice: offer.toFixed(2),
          dealerPrice: Math.round(offer * 0.88).toFixed(2),
          moq: mrp > 5000 ? 1 : mrp > 1000 ? 2 : 5,
          stock: 120 + ((n * 37) % 900),
          isFeatured: flags.includes("F"),
          isBestSeller: flags.includes("B"),
          isNewArrival: flags.includes("N"),
          isPremium: flags.includes("P"),
          soundLevel:
            catSlug === "single-sound" ? "High" : catSlug === "kids-special" ? "Very Low" : "Medium",
          burnTime: `${15 + ((n * 7) % 60)} sec`,
          effectColors: [EFFECTS[n % 6], EFFECTS[(n + 2) % 6], EFFECTS[(n + 4) % 6]],
          rating: (4.4 + ((n % 6) * 0.1)).toFixed(2),
          reviewCount: 18 + ((n * 13) % 240),
          viewCount: 400 + ((n * 91) % 5000),
        });
        n += 1;
      });
    }

    const createdProducts = await db
      .insert(products)
      .values(productRows)
      .onConflictDoNothing()
      .returning({ id: products.id });

    await db
      .insert(reviews)
      .values(
        SEED_REVIEWS.map((r, i) => ({
          ...r,
          productId: createdProducts[i * 4]?.id ?? createdProducts[i]?.id ?? null,
        })),
      )
      .onConflictDoNothing();
  } catch (err) {
    console.warn("[seed] Database unreachable, falling back to memory:", err);
  }
}

export async function ensureSeeded() {
  const g = globalThis as Seedable;
  if (!g.__mayilonSeed) {
    g.__mayilonSeed = seed().catch((err) => {
      console.error("[seed] failed", err);
      g.__mayilonSeed = undefined;
    });
  }
  await g.__mayilonSeed;
}

const alive = isNull(products.deletedAt);

function baseProductQuery() {
  return db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      name: products.name,
      nameTa: products.nameTa,
      categoryId: products.categoryId,
      shortDescription: products.shortDescription,
      description: products.description,
      imageUrl: products.imageUrl,
      gallery: products.gallery,
      videoUrl: products.videoUrl,
      packing: products.packing,
      piecesPerPack: products.piecesPerPack,
      mrp: products.mrp,
      discountPercent: products.discountPercent,
      offerPrice: products.offerPrice,
      dealerPrice: products.dealerPrice,
      gstPercent: products.gstPercent,
      moq: products.moq,
      stock: products.stock,
      status: products.status,
      isFeatured: products.isFeatured,
      isNewArrival: products.isNewArrival,
      isBestSeller: products.isBestSeller,
      isPremium: products.isPremium,
      soundLevel: products.soundLevel,
      burnTime: products.burnTime,
      effectColors: products.effectColors,
      ageRecommendation: products.ageRecommendation,
      usage: products.usage,
      rating: products.rating,
      reviewCount: products.reviewCount,
      viewCount: products.viewCount,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      deletedAt: products.deletedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryAccent: categories.accent,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));
}

export async function getCategories() {
  try {
    await ensureSeeded();
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        nameTa: categories.nameTa,
        slug: categories.slug,
        tagline: categories.tagline,
        description: categories.description,
        imageUrl: categories.imageUrl,
        accent: categories.accent,
        icon: categories.icon,
        sortOrder: categories.sortOrder,
        productCount: sql<number>`cast(count(${products.id}) as int)`,
      })
      .from(categories)
      .leftJoin(products, and(eq(products.categoryId, categories.id), isNull(products.deletedAt)))
      .where(isNull(categories.deletedAt))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder));
    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn("[getCategories] DB unreachable, returning in-memory categories:", err);
  }
  return getInMemoryCategories();
}

export type CategorySummary = Awaited<ReturnType<typeof getCategories>>[number];

export type ProductFilters = {
  category?: string;
  q?: string;
  sort?: string;
  min?: number;
  max?: number;
  flag?: string;
  limit?: number;
  offset?: number;
};

export async function getProducts(filters: ProductFilters = {}) {
  try {
    await ensureSeeded();
    const clauses: (SQL | undefined)[] = [alive, eq(products.status, "ACTIVE")];

    if (filters.category && filters.category !== "all") {
      clauses.push(eq(categories.slug, filters.category));
    }
    if (filters.q) {
      const term = `%${filters.q}%`;
      clauses.push(
        or(ilike(products.name, term), ilike(products.sku, term), ilike(categories.name, term)),
      );
    }
    if (typeof filters.min === "number") {
      clauses.push(sql`${products.offerPrice} >= ${filters.min}`);
    }
    if (typeof filters.max === "number") {
      clauses.push(sql`${products.offerPrice} <= ${filters.max}`);
    }
    if (filters.flag === "new") clauses.push(eq(products.isNewArrival, true));
    if (filters.flag === "best") clauses.push(eq(products.isBestSeller, true));
    if (filters.flag === "premium") clauses.push(eq(products.isPremium, true));
    if (filters.flag === "featured") clauses.push(eq(products.isFeatured, true));

    const where = and(...clauses.filter(Boolean));

    const orderBy = (() => {
      switch (filters.sort) {
        case "price-asc":
          return asc(sql`${products.offerPrice}::numeric`);
        case "price-desc":
          return desc(sql`${products.offerPrice}::numeric`);
        case "newest":
          return desc(products.createdAt);
        case "discount":
          return desc(products.discountPercent);
        case "alpha":
          return asc(products.name);
        case "best":
          return desc(products.reviewCount);
        default:
          return desc(products.isFeatured);
      }
    })();

    const [rows, [{ total }]] = await Promise.all([
      baseProductQuery()
        .where(where)
        .orderBy(orderBy, asc(products.name))
        .limit(filters.limit ?? 24)
        .offset(filters.offset ?? 0),
      db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(where),
    ]);

    if (rows.length > 0) {
      return { items: rows as ProductWithCategory[], total };
    }
  } catch (err) {
    console.warn("[getProducts] DB unreachable, returning in-memory products:", err);
  }

  let items = getInMemoryProducts();
  if (filters.category && filters.category !== "all") {
    items = items.filter((p) => p.categorySlug === filters.category);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q),
    );
  }
  if (filters.flag === "new") items = items.filter((p) => p.isNewArrival);
  if (filters.flag === "best") items = items.filter((p) => p.isBestSeller);
  if (filters.flag === "premium") items = items.filter((p) => p.isPremium);
  if (filters.flag === "featured") items = items.filter((p) => p.isFeatured);

  const total = items.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 24;
  return { items: items.slice(offset, offset + limit), total };
}

export async function getProductBySlug(slug: string) {
  try {
    await ensureSeeded();
    const rows = await baseProductQuery().where(and(eq(products.slug, slug), alive)).limit(1);
    if (rows.length > 0) return rows[0] as ProductWithCategory;
  } catch (err) {
    console.warn("[getProductBySlug] DB unreachable:", err);
  }
  const items = getInMemoryProducts();
  return items.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 8) {
  try {
    const rows = await baseProductQuery()
      .where(and(eq(products.categoryId, categoryId), alive, sql`${products.id} <> ${excludeId}`))
      .orderBy(desc(products.isBestSeller))
      .limit(limit);
    if (rows.length > 0) return rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getRelatedProducts] DB unreachable:", err);
  }
  const items = getInMemoryProducts();
  return items.filter((p) => p.categoryId === categoryId && p.id !== excludeId).slice(0, limit);
}

export async function getFeaturedProducts(limit = 8) {
  try {
    await ensureSeeded();
    const rows = await baseProductQuery()
      .where(and(alive, eq(products.isFeatured, true)))
      .orderBy(desc(products.rating))
      .limit(limit);
    if (rows.length) return rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getFeaturedProducts] DB unreachable:", err);
  }
  const items = getInMemoryProducts();
  const feat = items.filter((p) => p.isFeatured);
  return (feat.length ? feat : items).slice(0, limit);
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [] as ProductWithCategory[];
  try {
    const rows = await baseProductQuery().where(and(inArray(products.id, ids), alive));
    if (rows.length) return rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getProductsByIds] DB unreachable:", err);
  }
  const items = getInMemoryProducts();
  return items.filter((p) => ids.includes(p.id));
}

export async function getReviews(limit = 6) {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.isPublished, true))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
    if (rows.length) return rows;
  } catch (err) {
    console.warn("[getReviews] DB unreachable:", err);
  }
  return getInMemoryReviews().slice(0, limit);
}

export async function getAllProductSlugs() {
  try {
    await ensureSeeded();
    return await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(alive);
  } catch (err) {
    console.warn("[getAllProductSlugs] DB unreachable:", err);
  }
  const items = getInMemoryProducts();
  return items.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}
