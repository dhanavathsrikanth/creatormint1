import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/analytics/event
 * Records a page view or product view event.
 * Public — no auth required (analytics should never block).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, productId, creatorId, referrer, sessionId } = body as {
      eventType: string;
      productId?: string | null;
      creatorId?: string | null;
      referrer?: string | null;
      sessionId?: string | null;
    };

    if (!eventType) {
      return NextResponse.json({ error: "eventType required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    await supabase.from("launch_events").insert({
      event_type: eventType,
      product_id: productId ?? null,
      creator_id: creatorId ?? null,
      referrer: referrer ?? null,
      session_id: sessionId ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Analytics must never surface errors to clients
    console.error("[analytics/event]", err);
    return NextResponse.json({ ok: true }); // always 200
  }
}
