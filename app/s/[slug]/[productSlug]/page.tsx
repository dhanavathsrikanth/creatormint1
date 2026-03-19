import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { formatINR, calculateGST, formatFileSize } from "@/lib/utils";
import Link from "next/link";
import { CheckoutClient } from "@/components/checkout-client";
import { Package, ArrowLeft, Shield, Download, FileText } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, summary")
    .eq("slug", productSlug)
    .eq("is_published", true)
    .single<Pick<Product, "title" | "summary">>();
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.summary ?? undefined };
}

export default async function ProductPage({ params }: Props) {
  const { slug, productSlug } = await params;
  const supabase = await createClient();

  // Get creator
  const { data: creator } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, store_slug, avatar_url, store_accent_color, upi_id, monthly_revenue_paise")
    .eq("store_slug", slug)
    .single<Pick<Profile, "id" | "full_name" | "store_name" | "store_slug" | "avatar_url" | "store_accent_color" | "upi_id" | "monthly_revenue_paise">>();

  if (!creator) notFound();

  // Get product
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", productSlug)
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .single<Product>();

  if (!product) notFound();

  const gst = calculateGST(product.price_paise, 18);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${slug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {creator.store_name ?? creator.full_name ?? "Store"}
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            CreatorMint
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* Left: product info */}
          <div>
            {/* Cover */}
            {product.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.cover_image_url}
                alt={product.title}
                className="w-full aspect-video object-cover rounded-2xl mb-6 border border-border"
              />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-2xl mb-6 flex items-center justify-center border border-border">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-3">{product.title}</h1>

            {/* Summary */}
            {product.summary && (
              <p className="text-lg text-muted-foreground mb-6">{product.summary}</p>
            )}

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none text-foreground">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </div>
              </div>
            )}

            {/* What you get */}
            <div className="mt-8 bg-muted/30 border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground">What you get</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="w-4 h-4 text-primary shrink-0" />
                  Instant download after payment
                </li>
                {product.file_name && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    {product.file_name}
                    {product.file_size_bytes ? ` (${formatFileSize(product.file_size_bytes)})` : ""}
                  </li>
                )}
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  GST invoice included
                </li>
              </ul>
            </div>
          </div>

          {/* Right: checkout card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 space-y-4">
                {/* Price breakdown */}
                <div>
                  <div className="text-3xl font-bold text-foreground">{formatINR(product.price_paise)}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Base price</span>
                      <span>{formatINR(gst.base)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>{formatINR(gst.gst)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout form */}
                <CheckoutClient
                  productId={product.id}
                  productTitle={product.title}
                  pricePaise={product.price_paise}
                  creatorId={creator.id}
                  storeSlug={slug}
                  productSlug={productSlug}
                />

                {/* Trust badges */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Secure payment via Cashfree · UPI & Cards accepted
                </div>
              </div>

              {/* Creator info */}
              <div className="border-t border-border px-6 py-4 bg-muted/20 flex items-center gap-3">
                {creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatar_url} alt={creator.store_name ?? ""} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: creator.store_accent_color ?? "#3ECF8E" }}
                  >
                    {(creator.store_name ?? creator.full_name ?? "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{creator.store_name ?? creator.full_name}</p>
                  <Link href={`/s/${slug}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View all products
                  </Link>
                </div>
              </div>
            </div>

            {product.total_sales > 0 && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                🔥 {product.total_sales} people have bought this
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
