import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Product } from "@/types/database";
import { Package, Star, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Discover — CreatorMint" };
export const revalidate = 60;

export default async function BuyerDiscoverPage() {
  const supabase = await createClient();

  // Fetch all published products with creator info
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select(`
      *,
      creator:profiles!products_creator_id_fkey(full_name, store_name, store_slug, avatar_url)
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .returns<(Product & { creator: { full_name: string | null; store_name: string | null; store_slug: string | null; avatar_url: string | null } | null })[]>();

  const formatPrice = (paise: number) =>
    paise === 0 ? "Free" : `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">Discover</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Explore digital products from creators</p>
      </div>

      {(products ?? []).length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No products yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(products ?? []).map((product) => {
            const slug = product.creator?.store_slug;
            const href = slug ? `/${slug}/${product.slug}` : "#";

            return (
              <Link
                key={product.id}
                href={href}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200"
              >
                {/* Cover */}
                <div className="aspect-video bg-muted overflow-hidden">
                  {product.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 flex-1">{product.title}</h3>
                    <span className="text-sm font-black text-primary shrink-0">{formatPrice(product.price_paise)}</span>
                  </div>

                  {product.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {product.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {product.creator?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.creator.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary">
                            {(product.creator?.store_name ?? product.creator?.full_name ?? "C")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                        {product.creator?.store_name ?? product.creator?.full_name ?? "Creator"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ShoppingCart className="w-3 h-3" />
                      {product.total_sales ?? 0} sold
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-4 pb-4">
                  <div className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold text-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {product.price_paise === 0 ? "Get for Free" : "Buy Now"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
