import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RouteContext {
  params: Promise<{ requestId: string }>;
}

/**
 * GET /api/feature-requests/[requestId]/comments
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feature_request_comments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

/**
 * POST /api/feature-requests/[requestId]/comments
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login to comment" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "role">>();

  const { content } = await req.json().catch(() => ({}));
  if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const isAdmin = profile?.role === "admin";

  const { data, error } = await supabase
    .from("feature_request_comments")
    .insert({
      request_id: requestId,
      author_id: user.id,
      author_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Anonymous",
      author_role: profile?.role ?? "buyer",
      content: content.trim(),
      is_admin_response: isAdmin,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
