"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import type { SupportTicket, TicketMessage, TicketStatus } from "@/types/database";

interface AdminTicketThreadProps {
  ticket: SupportTicket;
  initialMessages: TicketMessage[];
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; className: string }[] = [
  { value: "open",            label: "Open",           className: "bg-red-100 text-red-700 border-red-200" },
  { value: "in_progress",     label: "In Progress",    className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "waiting_creator", label: "Awaiting User",  className: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "resolved",        label: "Resolved",       className: "bg-green-100 text-green-700 border-green-200" },
  { value: "closed",          label: "Closed",         className: "bg-gray-100 text-gray-600 border-gray-200" },
];

export function AdminTicketThread({ ticket, initialMessages }: AdminTicketThreadProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-ticket-${ticket.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "ticket_messages",
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        const newMsg = payload.new as TicketMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Send failed");
      setReply("");
      toast.success("Reply sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [reply, sending, ticket.id]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      setStatus(newStatus);
      toast.success(`Status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status control bar */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-xs font-semibold text-muted-foreground">Set Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            disabled={updatingStatus}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
              status === opt.value
                ? `${opt.className} ring-2 ring-offset-1 ring-current opacity-100`
                : "bg-muted text-muted-foreground border-border hover:border-gray-300 opacity-60 hover:opacity-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg) => {
          const isAgent = msg.sender_type === "agent";
          return (
            <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isAgent ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 px-1">
                  <span className={`text-[11px] font-semibold ${isAgent ? "text-blue-600" : "text-muted-foreground"}`}>
                    {isAgent ? "🛡 " : ""}{msg.sender_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isAgent
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Reply as support agent… (Enter to send)"
            rows={2}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
            className="flex-1 resize-none text-sm min-h-[60px]"
          />
          <Button
            size="sm"
            className="h-10 px-3 shrink-0 bg-blue-500 hover:bg-blue-600"
            onClick={handleSend}
            disabled={!reply.trim() || sending}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
