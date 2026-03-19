import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag, Download, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "My Orders — CreatorMint" };
export const revalidate = 0;

export default async function BuyerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      product:products(title, cover_image_url, slug,
        creator:profiles!products_creator_id_fkey(store_slug, store_name)
      )
    `)
    .eq("buyer_id", user!.id)
    .order("created_at", { ascending: false });

  const STATUS_STYLE: Record<string, string> = {
    paid:    "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed:  "bg-red-100 text-red-700",
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{orders?.length ?? 0} purchase{orders?.length !== 1 ? "s" : ""}</p>
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No purchases yet</p>
          <Link href="/buyer" className="text-sm font-semibold text-primary hover:underline">
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((order: any) => {
            const product = order.product;
            const storeSlug = product?.creator?.store_slug;
            const productUrl = storeSlug && product?.slug ? `/${storeSlug}/${product.slug}` : null;

            return (
              <div key={order.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
                {/* Cover */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                  {product?.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.cover_image_url} alt={product?.title ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{product?.title ?? "Product"}</p>
                  <p className="text-xs text-muted-foreground">
                    {product?.creator?.store_name ?? "—"} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">
                    {order.amount_paise === 0 ? "Free" : `₹${(order.amount_paise / 100).toLocaleString("en-IN")}`}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.payment_status] ?? "bg-muted text-muted-foreground"}`}>
                    {order.payment_status}
                  </span>
                </div>

                {/* Actions */}
                {order.payment_status === "paid" && productUrl && (
                  <Link
                    href={productUrl}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
