import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketList } from "@/components/support/TicketList";
import { Plus, LifeBuoy } from "lucide-react";
import type { SupportTicket } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support — CreatorMint" };

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<SupportTicket[]>();

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Support</h1>
            <p className="text-xs text-muted-foreground">A human replies in 2 hours</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/support/new">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New ticket
          </Link>
        </Button>
      </div>

      <TicketList tickets={tickets ?? []} />
    </div>
  );
}
