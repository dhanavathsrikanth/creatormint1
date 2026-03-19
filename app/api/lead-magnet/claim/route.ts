import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/lead-magnet/claim
 * Body: { productId: string; email: string }
 * No login required — buyer enters email and receives the file.
 */
export async function POST(req: NextRequest) {
  const { productId, email } = await req.json().catch(() => ({}));
  if (!productId || !email) {
    return NextResponse.json({ error: "productId and email are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify: product must exist, be published, and be free (price_paise === 0)
  const { data: product } = await admin
    .from("products")
    .select("id, title, file_url, price_paise, creator_id")
    .eq("id", productId)
    .eq("is_published", true)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.price_paise !== 0) {
    return NextResponse.json({ error: "This product is not free" }, { status: 400 });
  }

  // Log the claim
  await admin.from("lead_magnet_claims").upsert(
    { product_id: productId, email: email.toLowerCase().trim(), creator_id: product.creator_id },
    { onConflict: "product_id,email" }
  ).throwOnError().catch(() => null); // table may not exist yet — fail silently

  // Return the file URL directly (or a download token if you have signed URLs)
  return NextResponse.json({ file_url: product.file_url, title: product.title });
}
