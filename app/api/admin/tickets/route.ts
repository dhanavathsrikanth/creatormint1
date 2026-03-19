import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket, Profile } from "@/types/database";

/**
 * GET /api/admin/tickets — fetch all tickets (admin only)
 */
export async function GET(_req: NextRequest) {
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

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      creator:profiles!support_tickets_creator_id_fkey(full_name, email, store_name)
    `)
    .order("created_at", { ascending: false })
    .returns<(SupportTicket & { creator: { full_name: string | null; email: string | null; store_name: string | null } })[]>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: tickets ?? [] });
}
