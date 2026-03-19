import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/support/tickets/[id]/messages — creator sends reply */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ticket ownership
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .eq("creator_id", user.id)
    .maybeSingle<{ id: string; status: string }>();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "closed" || ticket.status === "resolved") {
    return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name">>();

  const body = await req.json().catch(() => ({}));
  const { message } = body as { message: string };
  if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: "creator",
      sender_name: profile?.full_name ?? "Creator",
      message: message.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update ticket status to "waiting_creator" if it was "in_progress"
  if (ticket.status === "waiting_creator") {
    await supabase
      .from("support_tickets")
      .update({ status: "open", updated_at: new Date().toISOString() })
      .eq("id", ticketId);
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
