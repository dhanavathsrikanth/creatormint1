"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import type { SupportTicket, TicketMessage } from "@/types/database";

interface TicketThreadProps {
  ticket: SupportTicket;
  initialMessages: TicketMessage[];
  creatorName: string;
}

export function TicketThread({ ticket, initialMessages, creatorName }: TicketThreadProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage;
          setMessages((prev) => {
            // Avoid duplicates (optimistic vs realtime)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Send failed");
      }
      setReply("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [reply, sending, ticket.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="flex flex-col h-full">
      {/* SLA notice */}
      {!isClosed && (
        <div className={`flex items-center gap-2 px-4 py-2.5 text-xs border-b border-border ${
          ticket.sla_breached
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
            : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {ticket.sla_breached
            ? "SLA was missed — we sincerely apologise. A team member will respond as soon as possible."
            : `First response by ${new Date(ticket.sla_deadline).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST`
          }
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((msg) => {
          const isCreator = msg.sender_type === "creator";
          return (
            <div
              key={msg.id}
              className={`flex ${isCreator ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] ${isCreator ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] text-muted-foreground">
                    {msg.sender_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isCreator
                    ? "bg-amber-500 text-white rounded-br-sm"
                    : "bg-muted dark:bg-muted/60 text-foreground rounded-bl-sm"
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
      {!isClosed ? (
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="flex-1 resize-none text-sm min-h-[60px]"
            />
            <Button
              size="sm"
              className="h-10 px-3 shrink-0"
              onClick={handleSend}
              disabled={!reply.trim() || sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            This ticket is {ticket.status}. Open a new ticket if you need further help.
          </p>
        </div>
      )}
    </div>
  );
}
