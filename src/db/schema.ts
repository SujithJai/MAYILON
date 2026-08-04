import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameTa: text("name_ta"),
    slug: text("slug").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    imageUrl: text("image_url"),
    accent: text("accent").notNull().default("#D4AF37"),
    icon: text("icon").notNull().default("sparkles"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    nameTa: text("name_ta"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    shortDescription: text("short_description"),
    description: text("description"),
    imageUrl: text("image_url"),
    gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
    videoUrl: text("video_url"),
    packing: text("packing").notNull().default("1 Box"),
    piecesPerPack: integer("pieces_per_pack").notNull().default(1),
    mrp: numeric("mrp", { precision: 12, scale: 2 }).notNull(),
    discountPercent: integer("discount_percent").notNull().default(80),
    offerPrice: numeric("offer_price", { precision: 12, scale: 2 }).notNull(),
    dealerPrice: numeric("dealer_price", { precision: 12, scale: 2 }),
    gstPercent: integer("gst_percent").notNull().default(18),
    moq: integer("moq").notNull().default(1),
    stock: integer("stock").notNull().default(500),
    status: text("status").notNull().default("ACTIVE"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isPremium: boolean("is_premium").notNull().default(false),
    soundLevel: text("sound_level").notNull().default("Medium"),
    burnTime: text("burn_time").notNull().default("20 sec"),
    effectColors: jsonb("effect_colors").$type<string[]>().notNull().default([]),
    ageRecommendation: text("age_recommendation").notNull().default("12+ with adult supervision"),
    usage: text("usage").notNull().default("Outdoor"),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.8"),
    reviewCount: integer("review_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_sku_uq").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_featured_idx").on(t.isFeatured),
  ],
);

/* ------------------------------------------------------------------ */
/* Customers + Estimates                                               */
/* ------------------------------------------------------------------ */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email"),
    role: text("role").notNull().default("CUSTOMER"),
    state: text("state"),
    district: text("district"),
    city: text("city"),
    pincode: text("pincode"),
    address: text("address"),
    gstNumber: text("gst_number"),
    dealerName: text("dealer_name"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("customers_mobile_uq").on(t.mobile)],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mobile: text("mobile").notNull(),
    code: text("code").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumed: boolean("consumed").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_mobile_idx").on(t.mobile)],
);

export const estimates = pgTable(
  "estimates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    estimateNumber: text("estimate_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email"),
    state: text("state").notNull(),
    district: text("district"),
    city: text("city"),
    pincode: text("pincode"),
    address: text("address"),
    gstNumber: text("gst_number"),
    dealerName: text("dealer_name"),
    transportName: text("transport_name"),
    deliveryLocation: text("delivery_location"),
    instructions: text("instructions"),
    couponCode: text("coupon_code"),
    itemCount: integer("item_count").notNull().default(0),
    mrpTotal: numeric("mrp_total", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    savings: numeric("savings", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    transportCharge: numeric("transport_charge", { precision: 12, scale: 2 }).notNull().default("0"),
    gstAmount: numeric("gst_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("NEW"),
    assignedTo: text("assigned_to"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("estimates_number_uq").on(t.estimateNumber),
    index("estimates_status_idx").on(t.status),
  ],
);

export const estimateItems = pgTable(
  "estimate_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    estimateId: uuid("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    categoryName: text("category_name"),
    packing: text("packing"),
    imageUrl: text("image_url"),
    mrp: numeric("mrp", { precision: 12, scale: 2 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("estimate_items_estimate_idx").on(t.estimateId)],
);

/* ------------------------------------------------------------------ */
/* Supporting                                                          */
/* ------------------------------------------------------------------ */

export const dealerApplications = pgTable("dealer_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  gstNumber: text("gst_number"),
  licenseNumber: text("license_number"),
  state: text("state").notNull(),
  city: text("city"),
  expectedVolume: text("expected_volume"),
  tier: text("tier").notNull().default("WHOLESALE"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  rating: integer("rating").notNull().default(5),
  title: text("title"),
  body: text("body").notNull(),
  isVerified: boolean("is_verified").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    source: text("source").notNull().default("footer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_email_uq").on(t.email)],
);

export const enquiries = pgTable("enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("NEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("settings_key_idx").on(t.key)],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Estimate = typeof estimates.$inferSelect;
export type EstimateItem = typeof estimateItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
