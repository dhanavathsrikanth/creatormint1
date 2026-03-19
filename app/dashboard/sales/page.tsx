import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Order } from "@/types/database";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sales — CreatorMint" };

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single<Pick<Profile, "id">>();
  if (!profile) redirect("/auth/login");

  const { data: rawOrders } = await supabase
    .from("orders")
    .select("*, products!orders_product_id_fkey(title, slug)")
    .eq("creator_id", user.id)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = (rawOrders ?? []) as Array<Order & {
    products: { title: string; slug: string } | null;
  }>;

  const totalRevenue = orders.reduce((sum, o) => sum + o.creator_payout_paise, 0);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orders.length} completed orders · {formatINR(totalRevenue)} total payouts
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <p className="text-muted-foreground text-sm">No sales yet — share your store link to get started!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_180px_120px_100px_80px] gap-x-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground">
            <span>Buyer</span>
            <span>Product</span>
            <span className="text-right">Payout</span>
            <span className="text-center">Invoice</span>
            <span className="text-right">When</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_180px_120px_100px_80px] gap-x-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors"
              >
                {/* Buyer */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {order.buyer_name ?? order.buyer_email.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{order.buyer_email}</p>
                </div>

                {/* Product */}
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {order.products?.title ?? "—"}
                  </p>
                </div>

                {/* Payout */}
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatINR(order.creator_payout_paise)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    of {formatINR(order.amount_paise)}
                  </p>
                </div>

                {/* Invoice */}
                <div className="text-center">
                  {order.gst_invoice_url ? (
                    <a
                      href={order.gst_invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Time */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
