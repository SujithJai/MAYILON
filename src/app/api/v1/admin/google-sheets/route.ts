import { NextResponse } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";
import { getAllOrdersFromStore } from "@/lib/orders-store";
import {
  appendOrderToGoogleSheet,
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  syncMultipleOrdersToGoogleSheet,
} from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const config = getGoogleSheetsConfig();
  const orders = getAllOrdersFromStore();

  return ok({
    webhookUrl: config.webhookUrl,
    autoSyncOnOrder: config.autoSyncOnOrder,
    lastSyncedAt: config.lastSyncedAt,
    isConfigured: Boolean(config.webhookUrl),
    totalOrders: orders.length,
  });
}

export async function POST(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const action = body.action || "save_config";

  if (action === "save_config") {
    const updated = saveGoogleSheetsConfig({
      webhookUrl: String(body.webhookUrl || "").trim(),
      autoSyncOnOrder: body.autoSyncOnOrder !== undefined ? Boolean(body.autoSyncOnOrder) : true,
    });
    return ok(updated, "Google Sheets configuration saved successfully");
  }

  if (action === "test") {
    const testOrder = {
      id: "est-test",
      estimateNumber: "MYL-TEST-GOOGLE",
      customerName: "Google Sheets Test User",
      mobile: "9876543210",
      email: "test@mayiloncrackers.com",
      state: "Tamil Nadu",
      district: "Virudhunagar",
      city: "Sivakasi",
      pincode: "626189",
      address: "4/95, Pachayaman Kovil Street, Naranapuram, Sivakasi",
      paymentMethod: "UPI",
      paymentStatus: "PAID" as const,
      status: "NEW" as const,
      itemCount: 2,
      mrpTotal: "1000.00",
      subtotal: "200.00",
      savings: "800.00",
      discount: "0.00",
      transportCharge: "0.00",
      gstAmount: "0.00",
      grandTotal: "200.00",
      createdAt: new Date().toISOString(),
      items: [
        {
          id: "prod-1",
          sku: "MYL-SND-01",
          name: "Test Fireworks Sample",
          categoryName: "Sound Crackers",
          packing: "1 Box",
          mrp: "500.00",
          price: "100.00",
          quantity: 2,
          lineTotal: "200.00",
        },
      ],
    };

    const result = await appendOrderToGoogleSheet(testOrder);
    if (!result.success) {
      return fail(result.message, [], 400);
    }
    return ok({ tested: true }, "Test order row appended to your Google Sheet successfully!");
  }

  if (action === "sync_all") {
    const orders = getAllOrdersFromStore();
    const result = await syncMultipleOrdersToGoogleSheet(orders);
    return ok(result, `Successfully synced ${result.synced} of ${result.total} orders to Google Sheets!`);
  }

  return fail("Invalid action", [], 400);
}
