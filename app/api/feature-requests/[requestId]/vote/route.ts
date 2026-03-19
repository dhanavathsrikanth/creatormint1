import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ requestId: string }>;
}

/**
 * POST /api/feature-requests/[requestId]/vote
 * Body: { vote_type: 'up' | 'down' }
 * - Same type again → remove vote (toggle off)
 * - Different type → switch vote
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login to vote" }, { status: 401 });

  const { vote_type } = await req.json().catch(() => ({ vote_type: "up" }));
  const voteType: "up" | "down" = vote_type === "down" ? "down" : "up";

  // Check existing vote
  const { data: existing } = await supabase
    .from("feature_request_votes")
    .select("vote_type")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.vote_type === voteType) {
      // Toggle OFF — remove vote
      await supabase
        .from("feature_request_votes")
        .delete()
        .eq("request_id", requestId)
        .eq("user_id", user.id);
    } else {
      // Switch vote type
      await supabase
        .from("feature_request_votes")
        .update({ vote_type: voteType })
        .eq("request_id", requestId)
        .eq("user_id", user.id);
    }
  } else {
    // New vote
    await supabase
      .from("feature_request_votes")
      .insert({ request_id: requestId, user_id: user.id, vote_type: voteType });
  }

  // Recalculate both counts
  const { data: votes } = await supabase
    .from("feature_request_votes")
    .select("vote_type")
    .eq("request_id", requestId);

  const upCount   = (votes ?? []).filter((v) => v.vote_type === "up").length;
  const downCount = (votes ?? []).filter((v) => v.vote_type === "down").length;

  await supabase
    .from("feature_requests")
    .update({ vote_count: upCount, downvote_count: downCount })
    .eq("id", requestId);

  // What's the user's current vote state?
  const { data: afterVote } = await supabase
    .from("feature_request_votes")
    .select("vote_type")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    user_vote: afterVote?.vote_type ?? null,
    vote_count: upCount,
    downvote_count: downCount,
  });
}
