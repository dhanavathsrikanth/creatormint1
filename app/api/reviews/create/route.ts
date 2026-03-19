import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, buyerName, rating, reviewText, reviewVideoUrl } = body;

    if (!productId || !buyerName || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        buyer_name: buyerName.trim(),
        rating,
        review_text: reviewText?.trim() || null,
        review_video_url: reviewVideoUrl?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Review insert error:", error);
      return NextResponse.json({ error: "Failed to post review" }, { status: 500 });
    }

    return NextResponse.json({ review: data });
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
