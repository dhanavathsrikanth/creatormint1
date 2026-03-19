import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

/**
 * POST /api/webhooks/cashfree
 * MUST return HTTP 200 before processing (rule 4).
 * Verifies Cashfree signature and updates order status.
 */
export async function POST(req: NextRequest) {
  // Rule 4: Return 200 immediately
  const body = await req.text();

  // Process asynchronously after response
  processWebhook(body, req.headers).catch((err) => {
    console.error("[cashfree webhook] processing error:", err);
  });

  return NextResponse.json({ received: true }, { status: 200 });
}

async function processWebhook(body: string, headers: Headers) {
  const supabase = createAdminClient();

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    console.error("[cashfree webhook] invalid JSON");
    return;
  }

  // Verify Cashfree signature
  const ts = headers.get("x-webhook-timestamp");
  const receivedSig = headers.get("x-webhook-signature");
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (secret && ts && receivedSig) {
    const { createHmac } = await import("crypto");
    const expectedSig = createHmac("sha256", secret)
      .update(`${ts}${body}`)
      .digest("base64");

    if (expectedSig !== receivedSig) {
      console.error("[cashfree webhook] signature mismatch");
      return;
    }
  }

  const eventType = event.type as string;
  const data = event.data as Record<string, unknown>;
  const orderData = data?.order as Record<string, unknown>;
  const paymentData = data?.payment as Record<string, unknown>;

  if (!orderData?.order_id) return;

  const cashfreeOrderId = orderData.order_id as string;
  // Our order IDs are stored as cm_<uuid_no_dashes>
  if (!cashfreeOrderId.startsWith("cm_")) return;

  // Find the order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("cashfree_order_id", cashfreeOrderId)
    .single<Order>();

  if (!order) {
    console.error("[cashfree webhook] order not found for:", cashfreeOrderId);
    return;
  }

  if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
    if (order.payment_status === "paid") return; // idempotent

    await supabase.from("orders").update({
      payment_status: "paid",
      cashfree_payment_id: paymentData?.cf_payment_id as string ?? null,
      download_token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    }).eq("id", order.id);

    await supabase.rpc("record_sale", {
      p_order_id: order.id,
      p_product_id: order.product_id,
      p_creator_id: order.creator_id,
      p_amount: order.amount_paise,
    });

    console.log("[cashfree webhook] order paid:", order.id);
  } else if (eventType === "PAYMENT_FAILED_WEBHOOK") {
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    console.log("[cashfree webhook] order failed:", order.id);
  }
}
