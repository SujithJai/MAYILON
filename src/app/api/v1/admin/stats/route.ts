import { ok, requireAdmin } from "@/lib/api";
import { getProducts } from "@/lib/data";
import { getAllOrdersFromStore } from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const orders = getAllOrdersFromStore();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 1. Calculate KPIs from persistent orders
  let pipeline = 0;
  let todayCount = 0;
  let todayValue = 0;
  let pendingCount = 0;
  let convertedCount = 0;

  const statusMap = new Map<string, { count: number; value: number }>();
  const productSalesMap = new Map<string, { name: string; sku: string; units: number; value: number }>();

  for (const o of orders) {
    const totalVal = parseFloat(String(o.grandTotal || "0").replace(/[^0-9.-]+/g, "")) || 0;
    pipeline += totalVal;

    const oDate = new Date(o.createdAt);
    if (oDate >= startOfDay) {
      todayCount += 1;
      todayValue += totalVal;
    }

    const st = o.status || "NEW";
    const curStatus = statusMap.get(st) || { count: 0, value: 0 };
    curStatus.count += 1;
    curStatus.value += totalVal;
    statusMap.set(st, curStatus);

    if (st === "NEW" || st === "PENDING") {
      pendingCount += 1;
    }
    if (o.paymentStatus === "PAID" || st === "PACKAGE READY" || st === "SHIPPED" || st === "DELIVERED") {
      convertedCount += 1;
    }

    // Top products aggregation
    if (Array.isArray(o.items)) {
      for (const item of o.items) {
        const itemQty = Number(item.quantity) || 1;
        const lineTotal = parseFloat(String(item.lineTotal || "0").replace(/[^0-9.-]+/g, "")) || 0;
        const key = item.sku || item.name;
        const existingProd = productSalesMap.get(key) || {
          name: item.name,
          sku: item.sku || "MYL",
          units: 0,
          value: 0,
        };
        existingProd.units += itemQty;
        existingProd.value += lineTotal;
        productSalesMap.set(key, existingProd);
      }
    }
  }

  const estimateCount = orders.length;
  const avgValue = estimateCount > 0 ? pipeline / estimateCount : 0;
  const conversionRate = estimateCount > 0 ? (convertedCount / estimateCount) * 100 : 0;

  const byStatus = Array.from(statusMap.entries()).map(([status, d]) => ({
    status,
    count: d.count,
    value: d.value,
  }));

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Products catalog count and low stock items
  let productsCount = 0;
  let lowStock: { name: string; sku: string; stock: number }[] = [];
  try {
    const { items, total } = await getProducts({ limit: 250 });
    productsCount = total;
    lowStock = items
      .filter((p) => Number(p.stock) < 200)
      .slice(0, 6)
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock),
      }));
  } catch (err) {
    console.warn("[admin/stats] Products read note:", err);
  }

  const recentEstimates = orders.slice(0, 8);
  const activity = orders.slice(0, 10).map((o, idx) => ({
    id: `act-${idx + 1}`,
    actor: o.customerName || "Customer",
    action: `Order #${o.estimateNumber} placed (${formatRupees(o.grandTotal)})`,
    entity: "estimate",
    createdAt: o.createdAt,
  }));

  return ok({
    kpis: {
      pipeline,
      estimateCount,
      avgValue,
      todayCount,
      todayValue,
      pending: pendingCount,
      conversionRate,
      products: productsCount,
      dealers: 0,
      enquiries: 0,
      subscribers: 0,
    },
    byStatus,
    topProducts,
    lowStock,
    recentEstimates,
    activity,
  });
}

function formatRupees(n: any) {
  const v = parseFloat(String(n || "0").replace(/[^0-9.-]+/g, "")) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}
