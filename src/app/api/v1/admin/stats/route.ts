import { desc, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  dealerApplications,
  enquiries,
  estimateItems,
  estimates,
  products,
  subscribers,
} from "@/db/schema";
import { ok, requireAdmin } from "@/lib/api";
import { ensureSeeded } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  await ensureSeeded();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    [totals],
    [today],
    byStatus,
    topProducts,
    lowStock,
    recentEstimates,
    [counts],
    activity,
  ] = await Promise.all([
    db
      .select({
        estimateCount: sql<number>`cast(count(*) as int)`,
        pipeline: sql<number>`coalesce(sum(${estimates.grandTotal}), 0)::float8`,
        avgValue: sql<number>`coalesce(avg(${estimates.grandTotal}), 0)::float8`,
      })
      .from(estimates),
    db
      .select({
        count: sql<number>`cast(count(*) as int)`,
        value: sql<number>`coalesce(sum(${estimates.grandTotal}), 0)::float8`,
      })
      .from(estimates)
      .where(gte(estimates.createdAt, startOfDay)),
    db
      .select({
        status: estimates.status,
        count: sql<number>`cast(count(*) as int)`,
        value: sql<number>`coalesce(sum(${estimates.grandTotal}), 0)::float8`,
      })
      .from(estimates)
      .groupBy(estimates.status),
    db
      .select({
        name: estimateItems.name,
        sku: estimateItems.sku,
        units: sql<number>`cast(sum(${estimateItems.quantity}) as int)`,
        value: sql<number>`coalesce(sum(${estimateItems.lineTotal}), 0)::float8`,
      })
      .from(estimateItems)
      .groupBy(estimateItems.name, estimateItems.sku)
      .orderBy(desc(sql`sum(${estimateItems.lineTotal})`))
      .limit(6),
    db
      .select({ name: products.name, sku: products.sku, stock: products.stock })
      .from(products)
      .where(isNull(products.deletedAt))
      .orderBy(products.stock)
      .limit(6),
    db.select().from(estimates).orderBy(desc(estimates.createdAt)).limit(8),
    db
      .select({
        products: sql<number>`(select count(*) from ${products} where ${products.deletedAt} is null)::int`,
        dealers: sql<number>`(select count(*) from ${dealerApplications})::int`,
        enquiries: sql<number>`(select count(*) from ${enquiries})::int`,
        subscribers: sql<number>`(select count(*) from ${subscribers})::int`,
      })
      .from(sql`(select 1) as t`),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10),
  ]);

  const newCount = byStatus.find((s) => s.status === "NEW")?.count ?? 0;
  const converted = byStatus.find((s) => s.status === "CONVERTED")?.count ?? 0;
  const conversionRate = totals.estimateCount ? (converted / totals.estimateCount) * 100 : 0;

  return ok({
    kpis: {
      pipeline: totals.pipeline,
      estimateCount: totals.estimateCount,
      avgValue: totals.avgValue,
      todayCount: today.count,
      todayValue: today.value,
      pending: newCount,
      conversionRate,
      ...counts,
    },
    byStatus,
    topProducts,
    lowStock,
    recentEstimates,
    activity,
  });
}
