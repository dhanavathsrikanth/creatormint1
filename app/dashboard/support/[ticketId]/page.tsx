import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TicketThread } from "@/components/support/TicketThread";
import type { SupportTicket, TicketMessage, Profile } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support ticket — CreatorMint" };

const STATUS_LABELS: Record<string, string> = {
  open: "🔴 Open",
  in_progress: "🔵 In Progress",
  waiting_creator: "🟡 Awaiting your reply",
  resolved: "🟢 Resolved",
  closed: "⚫ Closed",
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("creator_id", user.id)
    .single<SupportTicket>();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .returns<TicketMessage[]>();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<Pick<Profile, "full_name">>();

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/dashboard/support" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-[11px] text-muted-foreground">
            {STATUS_LABELS[ticket.status]} · {ticket.category}
          </p>
        </div>
      </div>

      {/* Thread fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col">
        <TicketThread
          ticket={ticket}
          initialMessages={messages ?? []}
          creatorName={profile?.full_name ?? "You"}
        />
      </div>
    </div>
  );
}
