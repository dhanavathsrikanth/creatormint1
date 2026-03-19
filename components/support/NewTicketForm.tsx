"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import type { TicketCategory } from "@/types/database";

const CATEGORIES: { value: TicketCategory; label: string; description: string; emoji: string }[] = [
  { value: "payment",   label: "Payment",   description: "Payout, UPI, refund issues",     emoji: "💳" },
  { value: "technical", label: "Technical", description: "Upload errors, broken features",  emoji: "🔧" },
  { value: "account",   label: "Account",   description: "Login, KYC, profile problems",    emoji: "👤" },
  { value: "billing",   label: "Billing",   description: "Platform fees, invoices",         emoji: "🧾" },
  { value: "other",     label: "Other",     description: "Anything else",                   emoji: "💬" },
];

export function NewTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !category) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create ticket");
      }
      const { ticket } = await res.json();
      toast.success("Ticket created! A human will reply in 2 hours.");
      router.push(`/dashboard/support/${ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category picker */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Category *
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                category === cat.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <span className="text-xl shrink-0 mt-0.5">{cat.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Subject *
        </Label>
        <Input
          id="subject"
          placeholder="Brief description of your issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
          disabled={loading}
          className="h-10"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Details *
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the issue in detail — include any error messages, steps to reproduce, and what you expected to happen."
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="resize-none text-sm"
        />
      </div>

      {/* SLA notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <span className="text-amber-600 text-base shrink-0">⏱</span>
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          A <strong>real human</strong> (not a bot) will respond within{" "}
          <strong>2 hours</strong>. Payment issues are flagged as high priority.
          You&apos;ll get an email confirmation with the exact deadline.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !category || !subject.trim() || !description.trim()}>
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating ticket…</>
        ) : (
          <><Send className="w-4 h-4 mr-2" /> Submit support request</>
        )}
      </Button>
    </form>
  );
}
