import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingBag, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("profiles")
    .select("store_name, store_description")
    .eq("store_slug", slug)
    .single<Pick<Profile, "store_name" | "store_description">>();
  if (!creator) return { title: "Store not found" };
  return {
    title: creator.store_name ?? slug,
    description: creator.store_description ?? undefined,
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, store_description, store_slug, avatar_url, store_accent_color")
    .eq("store_slug", slug)
    .single<Pick<Profile, "id" | "full_name" | "store_name" | "store_description" | "store_slug" | "avatar_url" | "store_accent_color">>();

  if (!creator) notFound();

  const { data: products = [] } = await supabase
    .from("products")
    .select("id, title, slug, summary, price_paise, cover_image_url, total_sales")
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .returns<Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales">[]>();

  const displayName = creator.store_name ?? creator.full_name ?? "Creator";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={displayName}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-border"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: creator.store_accent_color ?? "#3ECF8E" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
          {creator.store_description && (
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-balance">
              {creator.store_description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <span>Powered by</span>
            <Link href="/" className="font-semibold text-primary hover:underline">CreatorMint</Link>
          </p>
        </div>
      </header>

      {/* Products */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {(products ?? []).length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No products yet</h2>
            <p className="text-muted-foreground text-sm">Check back soon!</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-6">
              {(products ?? []).length} product{(products ?? []).length !== 1 ? "s" : ""}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(products ?? []).map((p) => (
                <Link
                  key={p.id}
                  href={`/s/${slug}/${p.slug}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
                >
                  {/* Cover */}
                  <div className="aspect-video bg-muted overflow-hidden">
                    {p.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    {p.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.summary}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-foreground">{formatINR(p.price_paise)}</span>
                      {p.total_sales > 0 && (
                        <span className="text-xs text-muted-foreground">{p.total_sales} sold</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" />
          <Link href="/" className="hover:text-primary transition-colors">CreatorMint</Link>
          {" · "}Sell digital products with UPI
        </p>
      </footer>
    </div>
  );
}
