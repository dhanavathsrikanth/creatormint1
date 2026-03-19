"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { MessageSquare, Clock, ChevronRight } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketCategory } from "@/types/database";

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string }> = {
  open:             { label: "Open",            className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  in_progress:      { label: "In Progress",     className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  waiting_creator:  { label: "Awaiting you",    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  resolved:         { label: "Resolved",         className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  closed:           { label: "Closed",           className: "bg-muted text-muted-foreground" },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  payment:   "💳 Payment",
  technical: "🔧 Technical",
  account:   "👤 Account",
  billing:   "🧾 Billing",
  other:     "💬 Other",
};

function SlaCountdown({ deadline, status }: { deadline: string; status: TicketStatus }) {
  const [minsLeft, setMinsLeft] = useState(differenceInMinutes(new Date(deadline), new Date()));

  useEffect(() => {
    if (status === "resolved" || status === "closed") return;
    const id = setInterval(() => {
      setMinsLeft(differenceInMinutes(new Date(deadline), new Date()));
    }, 30_000);
    return () => clearInterval(id);
  }, [deadline, status]);

  if (status === "resolved" || status === "closed") return null;
  if (minsLeft <= 0) return (
    <span className="text-[11px] font-semibold text-red-600">SLA breached</span>
  );

  const urgent = minsLeft < 30;
  const hours = Math.floor(minsLeft / 60);
  const mins = minsLeft % 60;
  const label = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

  return (
    <span className={`flex items-center gap-1 text-[11px] font-medium ${urgent ? "text-red-600" : "text-muted-foreground"}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}

interface TicketListProps {
  tickets: SupportTicket[];
}

export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No support tickets yet</p>
        <p className="text-xs text-muted-foreground mt-1">Need help? Open a ticket and a human will reply in 2 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const status = STATUS_STYLES[ticket.status];
        return (
          <Link
            key={ticket.id}
            href={`/dashboard/support/${ticket.id}`}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/20 transition-all group"
          >
            {/* Category + subject */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] text-muted-foreground">
                  {CATEGORY_LABELS[ticket.category]}
                </span>
                {ticket.sla_breached && (
                  <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                    SLA missed
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                {status.label}
              </span>
              <SlaCountdown deadline={ticket.sla_deadline} status={ticket.status} />
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
