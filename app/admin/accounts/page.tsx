import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { Users, ShieldCheck, Store, Mail, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Accounts — Admin" };
export const revalidate = 60;

export default async function AdminAccountsPage() {
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
  const { data: accounts } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const roles = ["all", "creator", "buyer", "admin"];

  const roleColors: Record<string, { badge: string; dot: string }> = {
    creator: { badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
    buyer:   { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    admin:   { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  };

  const counts = {
    all:     accounts?.length ?? 0,
    creator: accounts?.filter((a) => a.role === "creator").length ?? 0,
    buyer:   accounts?.filter((a) => a.role === "buyer").length ?? 0,
    admin:   accounts?.filter((a) => a.role === "admin").length ?? 0,
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">All Accounts</h1>
          <p className="text-xs text-muted-foreground">{counts.all} total users</p>
        </div>
      </div>

      {/* Role stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {roles.filter((r) => r !== "all").map((role) => {
          const cfg = roleColors[role] ?? { badge: "bg-muted text-muted-foreground", dot: "bg-gray-400" };
          return (
            <div key={role} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
              <div>
                <p className="text-xl font-black text-foreground">{counts[role as keyof typeof counts]}</p>
                <p className="text-xs text-muted-foreground capitalize font-medium">{role}s</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <div className="grid grid-cols-[1fr_180px_80px_110px] gap-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>User</span>
            <span>Store / Joined</span>
            <span className="text-center">Role</span>
            <span className="text-right">KYC Status</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {(accounts ?? []).length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No accounts found</p>
          ) : (
            (accounts ?? []).map((acc) => {
              const cfg = roleColors[acc.role] ?? { badge: "bg-muted text-muted-foreground" };
              return (
                <div
                  key={acc.id}
                  className="px-4 py-3.5 grid grid-cols-[1fr_180px_80px_110px] gap-4 items-center hover:bg-muted/20 transition-colors"
                >
                  {/* User */}
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(acc.full_name ?? acc.email ?? "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{acc.full_name ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        {acc.email ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Store / Joined */}
                  <div className="min-w-0">
                    <p className="text-xs text-foreground font-medium truncate">{acc.store_name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {new Date(acc.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "2-digit" })}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${cfg.badge}`}>
                      {acc.role}
                    </span>
                  </div>

                  {/* KYC */}
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      acc.kyc_status === "verified"  ? "bg-green-100 text-green-700" :
                      acc.kyc_status === "submitted" ? "bg-blue-100 text-blue-700" :
                      acc.kyc_status === "rejected"  ? "bg-red-100 text-red-700" :
                                                       "bg-muted text-muted-foreground"
                    }`}>
                      {acc.kyc_status ?? "pending"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
