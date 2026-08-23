import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, reviews } from "@/db/schema";
import { IMAGE_POOL, SEED_CATEGORIES, SEED_PRODUCTS, SEED_REVIEWS } from "./seed-data";
import { slugify } from "./slug";

type Seedable = typeof globalThis & { __mayilonSeed?: Promise<void> };

const CATEGORY_CODE: Record<string, string> = {
  "single-sound": "SND",
  "bijili-crackers": "BJL",
  "ground-chakkar": "GCK",
  "twinkling-star": "TWN",
  "flower-pots": "FLP",
  candles: "PNC",
  rockets: "RKT",
  bombs: "BMB",
  fountains: "FTN",
  "sky-shots": "SKY",
  "multi-shots": "MLT",
  sparklers: "SPK",
  novelties: "NVL",
  "gift-boxes": "GFT",
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
      const [name, mrp, packing, pieces, flags = "", customImg] = row;
      const discount = 80;
      const offer = Math.round((mrp * 20) / 100);
      const img = customImg ?? IMAGE_POOL[n % IMAGE_POOL.length];
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

  return applyCustomOverrides(list);
}

/**
 * Universal Custom Product Override Engine.
 * Guarantees that Admin edited prices, offer prices, photos (imageUrl, imageUrl2, imageUrl3)
 * and videos permanently overwrite database/seed items across all queries.
 */
function applyCustomOverrides(items: ProductWithCategory[]): ProductWithCategory[] {
  try {
    const { getCustomProductsFromStore, isSeedCleared, getDeletedProductIds } = require("./products-store");
    const customList = getCustomProductsFromStore();
    const seedCleared = isSeedCleared();
    const deletedSet = getDeletedProductIds();

    let baseList = items;
    if (seedCleared) {
      baseList = [];
    } else if (deletedSet && deletedSet.size > 0) {
      baseList = items.filter((p) => !deletedSet.has(p.id) && !deletedSet.has(p.sku));
    }

    if (!Array.isArray(customList) || customList.length === 0) return baseList;

    const idMap = new Map<string, ProductWithCategory>();
    const skuMap = new Map<string, ProductWithCategory>();
    const slugMap = new Map<string, ProductWithCategory>();

    for (const p of baseList) {
      idMap.set(p.id, p);
      if (p.sku) skuMap.set(p.sku, p);
      if (p.slug) slugMap.set(p.slug, p);
    }

    const updatedItems = [...baseList];

    for (const c of customList) {
      const match =
        idMap.get(c.id) ||
        (c.sku ? skuMap.get(c.sku) : undefined) ||
        (c.slug ? slugMap.get(c.slug) : undefined);

      const mrpNum = Number(c.mrp) || 100;
      const offerNum = Number(c.offerPrice) || mrpNum;
      const gallery = [c.imageUrl || match?.imageUrl, c.imageUrl2, c.imageUrl3].filter(
        Boolean,
      ) as string[];

      const override: ProductWithCategory = {
        ...(match || ({} as any)),
        id: c.id || match?.id || `prod-${Date.now()}`,
        sku: c.sku || match?.sku || `MYL-PROD`,
        slug: c.slug || match?.slug || slugify(c.name),
        name: c.name || match?.name || "Fireworks Item",
        nameTa: c.nameTa || match?.nameTa || null,
        categoryId: c.categoryId || match?.categoryId || "cat-1",
        shortDescription: c.shortDescription || match?.shortDescription || `${c.name} — Sivakasi quality product.`,
        description: c.description || match?.description || `${c.name} manufactured at Sivakasi unit with high purity chemical composition.`,
        imageUrl: c.imageUrl || match?.imageUrl || "/images/placeholder.jpg",
        gallery: gallery.length > 0 ? gallery : [match?.imageUrl || "/images/placeholder.jpg"],
        videoUrl: c.videoUrl || match?.videoUrl || null,
        packing: c.packing || match?.packing || "1 Box",
        piecesPerPack: c.piecesPerPack || match?.piecesPerPack || 1,
        mrp: mrpNum.toFixed(2),
        discountPercent: c.discountPercent || Math.round(((mrpNum - offerNum) / mrpNum) * 100),
        offerPrice: offerNum.toFixed(2),
        dealerPrice: (c.dealerPrice || offerNum * 0.88).toFixed(2),
        gstPercent: c.gstPercent || 18,
        moq: c.moq || match?.moq || 1,
        stock: c.stock || match?.stock || 100,
        status: c.status || "ACTIVE",
        isFeatured: Boolean(c.isFeatured ?? match?.isFeatured),
        isBestSeller: Boolean(c.isBestSeller ?? match?.isBestSeller),
        isNewArrival: Boolean(c.isNewArrival ?? match?.isNewArrival),
        isPremium: Boolean(c.isPremium ?? match?.isPremium),
        soundLevel: c.soundLevel || match?.soundLevel || "Medium",
        burnTime: c.burnTime || match?.burnTime || "20 sec",
        effectColors: ["Gold", "Red"],
        ageRecommendation: "12+ with adult supervision",
        usage: "Outdoor",
        rating: match?.rating || "4.90",
        reviewCount: match?.reviewCount || 25,
        viewCount: match?.viewCount || 150,
        createdAt: new Date(c.createdAt || match?.createdAt || Date.now()),
        updatedAt: new Date(),
        deletedAt: null,
        categoryName: c.categoryName || match?.categoryName || "Special Fireworks",
        categorySlug: slugify(c.categoryName || match?.categoryName || "special-fireworks"),
        categoryAccent: "#D4AF37",
      };

      if (match) {
        const idx = updatedItems.findIndex((it) => it.id === match.id || it.sku === match.sku);
        if (idx !== -1) updatedItems[idx] = override;
      } else {
        updatedItems.unshift(override);
      }
    }

    return updatedItems;
  } catch (err) {
    console.warn("[applyCustomOverrides] Error:", err);
    return items;
  }
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
        const [name, mrp, packing, pieces, flags = "", customImg] = row;
        const discount = 80;
        const offer = Math.round((mrp * 20) / 100);
        const img = customImg ?? IMAGE_POOL[n % IMAGE_POOL.length];
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
  let baseItems: ProductWithCategory[] = [];

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

    const [rows] = await Promise.all([
      baseProductQuery()
        .where(where)
        .orderBy(orderBy, asc(products.name))
        .limit(filters.limit ?? 250)
        .offset(filters.offset ?? 0),
    ]);

    if (rows.length > 0) {
      baseItems = rows as ProductWithCategory[];
    }
  } catch (err) {
    console.warn("[getProducts] DB unreachable, returning in-memory products:", err);
  }

  if (baseItems.length === 0) {
    baseItems = getInMemoryProducts();
    if (filters.category && filters.category !== "all") {
      baseItems = baseItems.filter((p) => p.categorySlug === filters.category);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      baseItems = baseItems.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q),
      );
    }
    if (filters.flag === "new") baseItems = baseItems.filter((p) => p.isNewArrival);
    if (filters.flag === "best") baseItems = baseItems.filter((p) => p.isBestSeller);
    if (filters.flag === "premium") baseItems = baseItems.filter((p) => p.isPremium);
    if (filters.flag === "featured") baseItems = baseItems.filter((p) => p.isFeatured);
  }

  // Apply Custom Admin Overwrites (Price, MRP, Photos & Videos)
  const merged = applyCustomOverrides(baseItems);
  const total = merged.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 250;

  return { items: merged.slice(offset, offset + limit), total };
}

export async function getProductBySlug(slug: string) {
  let item: ProductWithCategory | null = null;
  try {
    await ensureSeeded();
    const rows = await baseProductQuery().where(and(eq(products.slug, slug), alive)).limit(1);
    if (rows.length > 0) item = rows[0] as ProductWithCategory;
  } catch (err) {
    console.warn("[getProductBySlug] DB unreachable:", err);
  }
  if (!item) {
    const items = getInMemoryProducts();
    item = items.find((p) => p.slug === slug) ?? null;
  }
  if (!item) return null;
  const [overridden] = applyCustomOverrides([item]);
  return overridden;
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 8) {
  let items: ProductWithCategory[] = [];
  try {
    const rows = await baseProductQuery()
      .where(and(eq(products.categoryId, categoryId), alive, sql`${products.id} <> ${excludeId}`))
      .orderBy(desc(products.isBestSeller))
      .limit(limit);
    if (rows.length > 0) items = rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getRelatedProducts] DB unreachable:", err);
  }
  if (!items.length) {
    items = getInMemoryProducts().filter((p) => p.categoryId === categoryId && p.id !== excludeId);
  }
  return applyCustomOverrides(items).slice(0, limit);
}

export async function getFeaturedProducts(limit = 8) {
  let items: ProductWithCategory[] = [];
  try {
    await ensureSeeded();
    const rows = await baseProductQuery()
      .where(and(alive, eq(products.isFeatured, true)))
      .orderBy(desc(products.rating))
      .limit(limit);
    if (rows.length) items = rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getFeaturedProducts] DB unreachable:", err);
  }
  if (!items.length) {
    const memory = getInMemoryProducts();
    const feat = memory.filter((p) => p.isFeatured);
    items = feat.length ? feat : memory;
  }
  return applyCustomOverrides(items).slice(0, limit);
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [] as ProductWithCategory[];
  let items: ProductWithCategory[] = [];
  try {
    const rows = await baseProductQuery().where(and(inArray(products.id, ids), alive));
    if (rows.length) items = rows as ProductWithCategory[];
  } catch (err) {
    console.warn("[getProductsByIds] DB unreachable:", err);
  }
  if (!items.length) {
    items = getInMemoryProducts().filter((p) => ids.includes(p.id));
  }
  return applyCustomOverrides(items);
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
