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
      download_token_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }).eq("id", order.id);

    await supabase.rpc("record_sale", {
      p_order_id: order.id,
      p_product_id: order.product_id,
      p_creator_id: order.creator_id,
      p_amount: order.amount_paise,
    });

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && order.buyer_email) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const downloadUrl = `${siteUrl}/download/${order.download_token}`;
        
        // Note: Replace "onboarding@resend.dev" with your verified domain in production
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "CreatorMint <onboarding@resend.dev>",
            to: order.buyer_email,
            subject: "Your purchase is ready for download!",
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                <h2>Thank you for your purchase!</h2>
                <p>Your payment was successful and your product is ready to download.</p>
                <div style="background-color: #fef2f2; border: 1px solid #f87171; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="color: #b91c1c; margin-top: 0;">⚠️ Time Sensitive Link</h3>
                  <p style="color: #991b1b; margin-bottom: 0;">For security reasons, your download link will <strong>expire in exactly 10 minutes</strong>. Please download your files immediately.</p>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${downloadUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download Your Product</a>
                </div>
                <p style="color: #6b7280; font-size: 14px; text-align: center;">If the button doesn't work, copy and paste this link: <br/>${downloadUrl}</p>
              </div>
            `
          })
        });
        console.log("[cashfree webhook] email sent to:", order.buyer_email);
      } catch (emailErr) {
        console.error("[cashfree webhook] email sending failed:", emailErr);
      }
    }

    console.log("[cashfree webhook] order paid:", order.id);
  } else if (eventType === "PAYMENT_FAILED_WEBHOOK") {
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    console.log("[cashfree webhook] order failed:", order.id);
  }
}
