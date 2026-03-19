import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — CreatorMint" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) redirect("/auth/login");
  if (!profile.onboarding_complete) redirect("/onboarding");

  // ── Recent sales (last 10 paid orders with product title via join) ──
  const { data: rawSales } = await supabase
    .from("orders")
    .select("id, buyer_name, buyer_email, creator_payout_paise, created_at, products!orders_product_id_fkey(title)")
    .eq("creator_id", user.id)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(10);

  // Flatten the join so RecentSalesTicker gets a flat array
  const initialSales = (rawSales ?? []).map((o) => ({
    id: o.id as string,
    buyer_name: o.buyer_name as string | null,
    buyer_email: o.buyer_email as string,
    creator_payout_paise: o.creator_payout_paise as number,
    created_at: o.created_at as string,
    product_title: ((Array.isArray(o.products) ? o.products[0] : o.products) as { title?: string } | null)?.title ?? "Product",
  }));

  // ── 30-day chart data ──
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: rawChart } = await supabase
    .from("orders")
    .select("creator_payout_paise, created_at")
    .eq("creator_id", user.id)
    .eq("payment_status", "paid")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const chartData = (rawChart ?? []).map((o) => ({
    creator_payout_paise: o.creator_payout_paise as number,
    created_at: o.created_at as string,
  }));

  // ── Published product count ──
  const { data: products } = await supabase
    .from("products")
    .select("is_published")
    .eq("creator_id", user.id)
    .returns<Pick<Product, "is_published">[]>();

  const publishedCount = (products ?? []).filter((p) => p.is_published).length;
  const totalProducts = (products ?? []).length;

  return (
    <DashboardOverview
      profile={profile}
      initialSales={initialSales}
      chartData={chartData}
      publishedCount={publishedCount}
      totalProducts={totalProducts}
    />
  );
}
