import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Order, Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import { ShoppingCart, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

interface OrderWithProduct extends Order {
  products: Pick<Product, "title" | "cover_image_url"> | null;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  pending: "bg-amber-500/10 text-amber-600",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: orders = [] } = await supabase
    .from("orders")
    .select("*, products(title, cover_image_url)")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderWithProduct[]>();

  const totalRevenue = (orders ?? [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.amount_paise, 0);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {(orders ?? []).filter((o) => o.payment_status === "paid").length} paid orders · {formatINR(totalRevenue)} total
        </p>
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No orders yet</h2>
          <p className="text-muted-foreground text-sm">Share your store link to start getting sales.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center text-xs font-medium text-muted-foreground px-5 py-3 border-b border-border">
            <span>Buyer</span>
            <span className="w-36 hidden sm:block">Product</span>
            <span className="w-24 text-right">Amount</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-24 text-right">Date</span>
          </div>
          <div className="divide-y divide-border">
            {(orders ?? []).map((o) => (
              <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.buyer_email}</p>
                  {o.buyer_name && (
                    <p className="text-xs text-muted-foreground truncate">{o.buyer_name}</p>
                  )}
                </div>

                <div className="w-36 hidden sm:block min-w-0 px-2">
                  <p className="text-sm text-muted-foreground truncate">{o.products?.title ?? "—"}</p>
                </div>

                <div className="w-24 text-right">
                  <span className="text-sm font-semibold text-foreground">{formatINR(o.amount_paise)}</span>
                  {o.creator_payout_paise > 0 && (
                    <p className="text-xs text-muted-foreground">{formatINR(o.creator_payout_paise)} net</p>
                  )}
                </div>

                <div className="w-20 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[o.payment_status] ?? "bg-muted text-muted-foreground"}`}>
                    {o.payment_status}
                  </span>
                </div>

                <div className="w-24 text-right">
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </span>
                  {o.payment_status === "paid" && o.download_count > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-0.5 mt-0.5">
                      <Download className="w-3 h-3" /> {o.download_count}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
