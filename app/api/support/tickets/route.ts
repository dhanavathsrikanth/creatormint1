import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupportTicket, Profile } from "@/types/database";

/** GET /api/support/tickets — list creator's tickets */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<SupportTicket[]>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}

/** POST /api/support/tickets — create a new ticket */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name" | "email">>();

  const body = await req.json().catch(() => ({}));
  const { subject, description, category } = body as {
    subject: string; description: string; category: string;
  };

  if (!subject?.trim() || !description?.trim() || !category) {
    return NextResponse.json({ error: "subject, description, and category are required" }, { status: 400 });
  }

  // SLA: 2 hours from now
  const slaDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      creator_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority: category === "payment" ? "high" : "medium",
      sla_deadline: slaDeadline.toISOString(),
    })
    .select()
    .single<SupportTicket>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert the first message (the description) as creator message
  await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_type: "creator",
    sender_name: profile?.full_name ?? "Creator",
    message: description.trim(),
  });

  // Fire-and-forget confirmation email
  sendTicketConfirmationEmail({
    to: profile?.email ?? user.email ?? "",
    name: profile?.full_name ?? "Creator",
    ticketId: ticket.id,
    subject: ticket.subject,
    slaDeadline,
  }).catch(console.error);

  return NextResponse.json({ ticket }, { status: 201 });
}

async function sendTicketConfirmationEmail(opts: {
  to: string; name: string; ticketId: string; subject: string; slaDeadline: Date;
}) {
  const { to, name, ticketId, subject, slaDeadline } = opts;
  if (!to || !process.env.RESEND_API_KEY) return;

  const deadline = slaDeadline.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/support/${ticketId}`;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "CreatorMint Support <support@creatormi.nt>",
    to,
    subject: `We got your request — a human replies by ${deadline}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="font-size:20px;margin-bottom:8px">Hi ${name},</h2>
        <p style="color:#555;line-height:1.6">
          We received your support request: <strong>${subject}</strong>
        </p>
        <p style="color:#555;line-height:1.6">
          A real person (not a bot) will reply by 
          <strong style="color:#f59e0b">${deadline} IST</strong>.
        </p>
        <a href="${ticketUrl}"
           style="display:inline-block;margin-top:16px;padding:10px 20px;background:#f59e0b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View your ticket →
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          CreatorMint · If you didn't create this request, ignore this email.
        </p>
      </div>
    `,
  });
}
