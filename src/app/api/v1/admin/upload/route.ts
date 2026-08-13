import { NextResponse } from "next/server";
import { fail, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return fail("No image file provided", [], 400);

    // Read file buffer & convert to Data URL for instant storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return ok({
      url: dataUrl,
      fileName: file.name,
      size: file.size,
    }, "Image uploaded successfully");
  } catch (err) {
    console.error("[IMAGE UPLOAD ERROR]", err);
    return fail("Failed to upload image", [], 500);
  }
}
