import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlatformFee } from "@/lib/utils";
import type { Profile, Product } from "@/types/database";

/**
 * POST /api/orders/create
 * Creates an order and returns Cashfree payment URL.
 * Auth: public (guest checkout allowed).
 * All DB writes use admin client (rule 2).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, creatorId, buyerEmail, buyerName, storeSlug, productSlug } = body;

    if (!productId || !creatorId || !buyerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── Fetch product & creator ──────────────────────────────────
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_published", true)
      .single<Product>();

    if (!product) {
      return NextResponse.json({ error: "Product not found or not published" }, { status: 404 });
    }

    const { data: creator } = await supabase
      .from("profiles")
      .select("id, upi_id, monthly_revenue_paise, cashfree_vendor_id")
      .eq("id", creatorId)
      .single<Pick<Profile, "id" | "upi_id" | "monthly_revenue_paise" | "cashfree_vendor_id">>();

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // ── Calculate fees (all in paise) ────────────────────────────
    const amountPaise = product.price_paise;
    const platformFeePaise = calculatePlatformFee(amountPaise, creator.monthly_revenue_paise);
    const creatorPayoutPaise = amountPaise - platformFeePaise;

    // ── Create order record ──────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        product_id: productId,
        creator_id: creatorId,
        buyer_email: buyerEmail,
        buyer_name: buyerName ?? null,
        amount_paise: amountPaise,
        platform_fee_paise: platformFeePaise,
        creator_payout_paise: creatorPayoutPaise,
        currency: "INR",
        payment_status: "pending",
      })
      .select("id, download_token")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // ── Create Cashfree order ────────────────────────────────────
    const cashfreeOrderId = `cm_${order.id.replace(/-/g, "")}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const returnUrl = `${siteUrl}/api/orders/verify?orderId=${order.id}&token=${order.download_token}`;

    const cashfreeApiKey = process.env.CASHFREE_APP_ID;
    const cashfreeSecret = process.env.CASHFREE_SECRET_KEY;
    const cashfreeEnv = process.env.CASHFREE_ENV ?? "sandbox";
    const cashfreeBaseUrl = cashfreeEnv === "production"
      ? "https://api.cashfree.com"
      : "https://sandbox.cashfree.com";

    if (!cashfreeApiKey || !cashfreeSecret) {
      // ── Dev fallback: skip payment, return direct download link ─
      console.warn("Cashfree credentials not set — using dev bypass");
      await supabase
        .from("orders")
        .update({ payment_status: "paid", cashfree_order_id: "dev_bypass" })
        .eq("id", order.id);
      await supabase.rpc("record_sale", {
        p_order_id: order.id,
        p_product_id: productId,
        p_creator_id: creatorId,
        p_amount: amountPaise,
      });
      return NextResponse.json({
        paymentUrl: `${siteUrl}/download/${order.download_token}`,
        orderId: order.id,
        devBypass: true,
      });
    }

    const cfPayload = {
      order_id: cashfreeOrderId,
      order_amount: (amountPaise / 100).toFixed(2),
      order_currency: "INR",
      customer_details: {
        customer_id: buyerEmail.replace(/[^a-zA-Z0-9_-]/g, "_"),
        customer_email: buyerEmail,
        customer_name: buyerName ?? "Customer",
        customer_phone: "9999999999", // required by Cashfree, buyer can update at checkout
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${siteUrl}/api/webhooks/cashfree`,
      },
    };

    const cfRes = await fetch(`${cashfreeBaseUrl}/pg/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeApiKey,
        "x-client-secret": cashfreeSecret,
      },
      body: JSON.stringify(cfPayload),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok) {
      console.error("Cashfree error:", cfData);
      return NextResponse.json({ error: "Payment gateway error" }, { status: 502 });
    }

    // ── Update order with Cashfree order ID ──────────────────────
    await supabase
      .from("orders")
      .update({ cashfree_order_id: cashfreeOrderId })
      .eq("id", order.id);

    return NextResponse.json({
      paymentUrl: cfData.payment_link ?? cfData.payment_session_id,
      orderId: order.id,
      cashfreeOrderId,
    });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
