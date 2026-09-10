import { revalidatePath } from "next/cache";
import { ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export type FestivalBannerConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  discountText: string;
};

export const DEFAULT_FESTIVAL_BANNER: FestivalBannerConfig = {
  enabled: true,
  title: "விநாயகர் சதுர்த்தி & தீபாவளி மெகா ஆஃபர்! · Festive Mega Sale 2026",
  subtitle: "Factory-Direct Sivakasi Crackers · 80% Off MRP on All Premium Fireworks & Family Gift Boxes",
  badge: "🔥 Vinayagar Chaturthi & Diwali Special Offers Live",
  discountText: "Flat 80% Direct Factory Discount",
  imageUrl: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&w=1600&q=80",
  buttonText: "Instant Order / Cart",
  buttonLink: "/estimate",
};

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url || url.includes("127.0.0.1") || url.includes("localhost")) {
    return ok(DEFAULT_FESTIVAL_BANNER);
  }
  try {
    const { pool } = await import("@/db");
    const res = await pool.query(
      `SELECT value FROM app_settings WHERE key = 'homepage_festival_banner' LIMIT 1;`
    );
    if (res?.rows?.[0]?.value) {
      return ok({ ...DEFAULT_FESTIVAL_BANNER, ...res.rows[0].value });
    }
  } catch (err) {
    console.warn("[GET /banner] Note:", err);
  }
  return ok(DEFAULT_FESTIVAL_BANNER);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config: FestivalBannerConfig = {
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
      title: body.title ? String(body.title).trim() : DEFAULT_FESTIVAL_BANNER.title,
      subtitle: body.subtitle ? String(body.subtitle).trim() : DEFAULT_FESTIVAL_BANNER.subtitle,
      badge: body.badge ? String(body.badge).trim() : DEFAULT_FESTIVAL_BANNER.badge,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : DEFAULT_FESTIVAL_BANNER.imageUrl,
      buttonText: body.buttonText ? String(body.buttonText).trim() : DEFAULT_FESTIVAL_BANNER.buttonText,
      buttonLink: body.buttonLink ? String(body.buttonLink).trim() : DEFAULT_FESTIVAL_BANNER.buttonLink,
      discountText: body.discountText ? String(body.discountText).trim() : DEFAULT_FESTIVAL_BANNER.discountText,
    };

    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (url && !url.includes("127.0.0.1") && !url.includes("localhost")) {
      const { pool } = await import("@/db");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('homepage_festival_banner', $1::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW();
      `, [JSON.stringify(config)]);
    }

    try {
      revalidatePath("/");
    } catch {}

    return ok(config);
  } catch (err: any) {
    console.error("[POST /banner] Error:", err);
    return fail(err?.message || "Failed to save banner", 500);
  }
}
