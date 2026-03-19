import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RouteContext {
  params: Promise<{ requestId: string }>;
}

/**
 * PATCH /api/admin/feature-requests/[requestId] — update status + admin response
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { requestId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) update.status = body.status;
  if (body.admin_response !== undefined) {
    update.admin_response = body.admin_response || null;
    update.admin_response_at = body.admin_response ? new Date().toISOString() : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feature_requests")
    .update(update)
    .eq("id", requestId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
