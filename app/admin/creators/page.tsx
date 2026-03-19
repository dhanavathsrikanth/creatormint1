import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Creators — Admin" };
export const revalidate = 60;

type CreatorStats = Profile & {
  product_count: number;
};

export default async function AdminCreatorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<Pick<Profile, "role">>();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const { data: creators } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "creator")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  // Get product counts for each creator
  const creatorsWithCounts: CreatorStats[] = await Promise.all(
    (creators ?? []).map(async (c) => {
      const { count } = await admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", c.id);
      return { ...c, product_count: count ?? 0 };
    })
  );

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Creators</h1>
          <p className="text-xs text-muted-foreground">{creatorsWithCounts.length} registered</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="grid grid-cols-[1fr_160px_80px_120px_100px] text-xs font-semibold text-muted-foreground uppercase tracking-wider gap-4">
            <span>Creator</span>
            <span>Store</span>
            <span className="text-center">Products</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Joined</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {creatorsWithCounts.length === 0 ? (
            <p className="text-center py-16 text-muted-foreground text-sm">No creators yet</p>
          ) : (
            creatorsWithCounts.map((c) => (
              <div key={c.id} className="px-4 py-3.5 grid grid-cols-[1fr_160px_80px_120px_100px] gap-4 items-center hover:bg-muted/20 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-foreground truncate">{c.store_name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.store_slug ? `/${c.store_slug}` : "No slug"}</p>
                </div>
                <p className="text-sm text-center font-semibold text-foreground">{c.product_count}</p>
                <p className="text-sm text-right font-semibold text-foreground">
                  ₹{((c.total_revenue_paise ?? 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-right text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
