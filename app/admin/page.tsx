import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { LifeBuoy, Users, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — CreatorMint" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<Pick<Profile, "role">>();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { count: totalCreators },
    { count: totalProducts },
    { count: openTickets },
    { count: totalTickets },
    { count: resolvedTickets },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "creator"),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("support_tickets").select("*", { count: "exact", head: true }),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved"),
  ]);

  const stats = [
    { label: "Total Creators", value: totalCreators ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Products", value: totalProducts ?? 0, icon: Package, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Open Tickets", value: openTickets ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Resolved Tickets", value: resolvedTickets ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Total Tickets", value: totalTickets ?? 0, icon: LifeBuoy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform metrics at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{s.value.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
