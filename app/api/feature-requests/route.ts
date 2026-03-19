import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

/**
 * GET /api/feature-requests — list all requests with user vote status
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let query = supabase
    .from("feature_requests")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("category", category);

  const { data: requests, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get user's votes
  let userVotes: string[] = [];
  if (user) {
    const { data: votes } = await supabase
      .from("feature_request_votes")
      .select("request_id")
      .eq("user_id", user.id);
    userVotes = (votes ?? []).map((v) => v.request_id);
  }

  return NextResponse.json({
    requests: requests ?? [],
    userVotes,
  });
}

/**
 * POST /api/feature-requests — create a new request
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login to submit a request" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "role">>();

  const { title, description, category } = await req.json().catch(() => ({}));
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("feature_requests")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category || "general",
      author_id: user.id,
      author_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Anonymous",
      author_role: profile?.role ?? "buyer",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data }, { status: 201 });
}
