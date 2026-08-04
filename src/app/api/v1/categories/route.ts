import { getCategories } from "@/lib/data";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getCategories();
  return ok({ items, total: items.length });
}
