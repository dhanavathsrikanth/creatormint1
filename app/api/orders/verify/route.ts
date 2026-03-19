import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

/**
 * GET /api/orders/verify?orderId=...&token=...
 * Called by Cashfree return_url after payment.
 * Confirms payment and redirects to download page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const token = searchParams.get("token");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!orderId || !token) {
    return NextResponse.redirect(`${siteUrl}/?error=invalid_params`);
  }

  const supabase = createAdminClient();

  // Fetch order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("download_token", token)
    .single<Order>();

  if (!order) {
    return NextResponse.redirect(`${siteUrl}/?error=order_not_found`);
  }

  // If already paid, go straight to download
  if (order.payment_status === "paid") {
    return NextResponse.redirect(`${siteUrl}/download/${token}`);
  }

  // Verify with Cashfree
  const cashfreeApiKey = process.env.CASHFREE_APP_ID;
  const cashfreeSecret = process.env.CASHFREE_SECRET_KEY;
  const cashfreeEnv = process.env.CASHFREE_ENV ?? "sandbox";
  const cashfreeBaseUrl = cashfreeEnv === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

  if (cashfreeApiKey && cashfreeSecret && order.cashfree_order_id) {
    try {
      const cfRes = await fetch(`${cashfreeBaseUrl}/pg/orders/${order.cashfree_order_id}`, {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": cashfreeApiKey,
          "x-client-secret": cashfreeSecret,
        },
      });
      const cfData = await cfRes.json();

      if (cfData.order_status === "PAID") {
        await supabase.from("orders").update({
          payment_status: "paid",
          cashfree_payment_id: cfData.payments?.[0]?.cf_payment_id ?? null,
          download_token_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        }).eq("id", orderId);

        await supabase.rpc("record_sale", {
          p_order_id: orderId,
          p_product_id: order.product_id,
          p_creator_id: order.creator_id,
          p_amount: order.amount_paise,
        });

        return NextResponse.redirect(`${siteUrl}/download/${token}`);
      }
    } catch (err) {
      console.error("Cashfree verify error:", err);
    }
  }

  // Payment not confirmed yet — show pending page
  return NextResponse.redirect(`${siteUrl}/download/${token}?status=pending`);
}
