import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminTicketThread } from "@/components/admin/AdminTicketThread";
import type { Profile, SupportTicket, TicketMessage } from "@/types/database";

type TicketWithCreator = SupportTicket & {
  creator: { full_name: string | null; email: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  open: "🔴 Open",
  in_progress: "🔵 In Progress",
  waiting_creator: "🟡 Awaiting User",
  resolved: "🟢 Resolved",
  closed: "⚫ Closed",
};

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select("*, creator:profiles!support_tickets_creator_id_fkey(full_name, email)")
    .eq("id", ticketId)
    .single<TicketWithCreator>();

  if (!ticket) notFound();

  const { data: messages } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .returns<TicketMessage[]>();

  const creatorName = ticket.creator?.full_name ?? ticket.creator?.email ?? "Unknown Creator";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/admin/tickets" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-[11px] text-muted-foreground">
            {STATUS_LABELS[ticket.status]} · {ticket.category} · from <span className="font-semibold">{creatorName}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AdminTicketThread
          ticket={ticket}
          initialMessages={messages ?? []}
        />
      </div>
    </div>
  );
}
