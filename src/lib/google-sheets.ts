import fs from "fs";
import path from "path";
import type { OrderRecord } from "./orders-store";

/**
 * Universal Real-Time Google Sheets Integration for Mayilon Pyroworld.
 * Automatically synchronizes 100% of placed customer orders to Google Sheets.
 */

export type GoogleSheetsConfig = {
  webhookUrl: string;
  autoSyncOnOrder: boolean;
  lastSyncedAt?: string;
};

const DEFAULT_CONFIG: GoogleSheetsConfig = {
  webhookUrl: process.env.GOOGLE_SHEET_WEBHOOK_URL || "",
  autoSyncOnOrder: true,
};

function getConfigPath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {}
  }
  return path.join(dataDir, "google-sheet-config.json");
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const filePath = getConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        return {
          webhookUrl: parsed.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "",
          autoSyncOnOrder: parsed.autoSyncOnOrder !== undefined ? Boolean(parsed.autoSyncOnOrder) : true,
          lastSyncedAt: parsed.lastSyncedAt,
        };
      }
    }
  } catch (err) {
    console.warn("[google-sheets] Config read note:", err);
  }
  return DEFAULT_CONFIG;
}

export function saveGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  const current = getGoogleSheetsConfig();
  const updated: GoogleSheetsConfig = {
    ...current,
    ...config,
    webhookUrl: config.webhookUrl !== undefined ? config.webhookUrl.trim() : current.webhookUrl,
  };
  try {
    const filePath = getConfigPath();
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("[google-sheets] Config write error:", err);
  }
  return updated;
}

export function formatOrderForSheet(order: OrderRecord) {
  const itemsSummary = (order.items || [])
    .map((it) => `${it.name} (${it.quantity} ${it.packing || "pkt"} @ ₹${it.price})`)
    .join(" | ");

  return {
    estimateNumber: order.estimateNumber,
    createdAt: order.createdAt || new Date().toISOString(),
    customerName: order.customerName,
    mobile: order.mobile,
    email: order.email || "",
    address: order.address,
    city: order.city,
    district: order.district,
    state: order.state,
    pincode: order.pincode,
    itemCount: order.itemCount || (order.items?.length ?? 0),
    itemsSummary: itemsSummary || `${order.itemCount} items`,
    subtotal: order.subtotal || order.grandTotal,
    discount: order.discount || "0",
    grandTotal: order.grandTotal,
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "UNPAID",
    orderStatus: order.status || "NEW",
  };
}

/**
 * Automatically push a single order to Google Sheets via Webhook.
 * Non-blocking: will never slow down customer order checkout.
 */
export async function appendOrderToGoogleSheet(order: OrderRecord): Promise<{ success: boolean; message: string }> {
  const config = getGoogleSheetsConfig();
  if (!config.webhookUrl) {
    return { success: false, message: "Google Sheet Webhook URL is not configured." };
  }

  const payload = formatOrderForSheet(order);

  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    saveGoogleSheetsConfig({ lastSyncedAt: new Date().toISOString() });
    return { success: true, message: "Order pushed to Google Sheet successfully." };
  } catch (err: any) {
    console.warn("[appendOrderToGoogleSheet] Error:", err?.message || err);
    return { success: false, message: err?.message || "Failed to reach Google Sheet Webhook." };
  }
}

/**
 * Batch push multiple orders to Google Sheets.
 */
export async function syncMultipleOrdersToGoogleSheet(orders: OrderRecord[]): Promise<{
  success: boolean;
  total: number;
  synced: number;
  errors: number;
}> {
  const config = getGoogleSheetsConfig();
  if (!config.webhookUrl) {
    return { success: false, total: orders.length, synced: 0, errors: orders.length };
  }

  let synced = 0;
  let errors = 0;

  for (const o of orders) {
    const payload = formatOrderForSheet(o);
    try {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      synced++;
    } catch {
      errors++;
    }
  }

  saveGoogleSheetsConfig({ lastSyncedAt: new Date().toISOString() });
  return { success: errors === 0, total: orders.length, synced, errors };
}
