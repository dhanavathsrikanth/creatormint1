import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RouteContext {
  params: Promise<{ ticketId: string }>;
}

/**
 * PATCH /api/admin/tickets/[ticketId]/status
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json().catch(() => ({}));
  const VALID = ["open", "in_progress", "waiting_creator", "resolved", "closed"];
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const update: Record<string, unknown> = { status };
  if (status === "resolved") update.resolved_at = new Date().toISOString();

  const { data, error } = await admin
    .from("support_tickets")
    .update(update)
    .eq("id", ticketId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
