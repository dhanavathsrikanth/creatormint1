import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile, SupportTicket, TicketStatus } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tickets — Admin" };
export const revalidate = 0;

type TicketWithCreator = SupportTicket & {
  creator: { full_name: string | null; email: string | null; store_name: string | null } | null;
};

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string }> = {
  open:             { label: "Open",           className: "bg-red-100 text-red-700" },
  in_progress:      { label: "In Progress",    className: "bg-blue-100 text-blue-700" },
  waiting_creator:  { label: "Awaiting User",  className: "bg-amber-100 text-amber-700" },
  resolved:         { label: "Resolved",       className: "bg-green-100 text-green-700" },
  closed:           { label: "Closed",         className: "bg-gray-100 text-gray-600" },
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<Pick<Profile, "role">>();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  let query = admin
    .from("support_tickets")
    .select("*, creator:profiles!support_tickets_creator_id_fkey(full_name, email, store_name)")
    .order("created_at", { ascending: false });

  if (sp.status && sp.status !== "all") {
    query = query.eq("status", sp.status);
  }

  const { data: tickets } = await query.returns<TicketWithCreator[]>();

  const filters: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Closed", value: "closed" },
  ];

  const activeFilter = sp.status ?? "all";

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <LifeBuoy className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-xs text-muted-foreground">{tickets?.length ?? 0} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/admin/tickets?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeFilter === f.value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {(tickets ?? []).length === 0 ? (
          <p className="text-center py-16 text-muted-foreground text-sm">No tickets found</p>
        ) : (
          (tickets ?? []).map((ticket) => {
            const status = STATUS_STYLES[ticket.status];
            const creatorName = ticket.creator?.store_name ?? ticket.creator?.full_name ?? ticket.creator?.email ?? "Unknown";
            return (
              <Link
                key={ticket.id}
                href={`/admin/tickets/${ticket.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/20 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] text-muted-foreground">from: <span className="font-semibold text-foreground">{creatorName}</span></span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{ticket.category}</span>
                    {ticket.sla_breached && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">SLA missed</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                  {status.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
