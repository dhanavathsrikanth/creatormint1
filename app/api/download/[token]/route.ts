import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, Product } from "@/types/database";

/**
 * GET /api/download/[token]
 * Token-gated product file delivery (rule 5 — files never public).
 * Increments download count.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Validate token
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("download_token", token)
    .eq("payment_status", "paid")
    .single<Order>();

  if (!order) {
    return NextResponse.json({ error: "Invalid or expired download token" }, { status: 403 });
  }

  // Check token expiry
  if (order.download_token_expires_at) {
    const expires = new Date(order.download_token_expires_at);
    if (expires < new Date()) {
      return NextResponse.json({ error: "Download link has expired" }, { status: 410 });
    }
  }

  // Get product file key
  const { data: product } = await supabase
    .from("products")
    .select("file_key, file_name, file_size_bytes")
    .eq("id", order.product_id)
    .single<Pick<Product, "file_key" | "file_name" | "file_size_bytes">>();

  if (!product?.file_key) {
    return NextResponse.json({ error: "Product file not found" }, { status: 404 });
  }

  // Generate signed URL (valid 60 seconds)
  const { data: signed, error: signedError } = await supabase.storage
    .from("product-files")
    .createSignedUrl(product.file_key, 60, {
      download: product.file_name ?? true,
    });

  if (signedError || !signed?.signedUrl) {
    console.error("Signed URL error:", signedError);
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  // Increment download count (fire-and-forget)
  supabase
    .from("orders")
    .update({ download_count: order.download_count + 1 })
    .eq("id", order.id)
    .then(() => { /* ignore */ });

  // Redirect to signed URL
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
