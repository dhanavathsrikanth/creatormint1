import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RouteContext {
  params: Promise<{ ticketId: string }>;
}

/**
 * POST /api/admin/tickets/[ticketId]/reply
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "full_name">>();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { message } = await req.json().catch(() => ({}));
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Insert the agent message
  const { data: msg, error: msgErr } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: "agent",
      sender_name: profile.full_name ?? "Support Agent",
      message: message.trim(),
    })
    .select()
    .single();

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  // Update ticket status to in_progress if still open
  await admin
    .from("support_tickets")
    .update({
      status: "in_progress",
      first_response_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .eq("status", "open");

  return NextResponse.json({ message: msg });
}
