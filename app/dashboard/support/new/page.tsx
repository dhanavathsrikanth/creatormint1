import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewTicketForm } from "@/components/support/NewTicketForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New support ticket — CreatorMint" };

export default function NewTicketPage() {
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/support" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Open a support ticket</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            A real human (not a bot) will reply within 2 hours
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <NewTicketForm />
      </div>
    </div>
  );
}
