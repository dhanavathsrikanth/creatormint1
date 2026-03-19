import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Profile, Product, ProductReview } from "@/types/database";
import { formatFileSize } from "@/lib/utils";
import Link from "next/link";
import { ProductCTA } from "@/components/storefront/product-cta";
import { ProductReviews } from "@/components/storefront/product-reviews";
import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import { ArrowLeft, Download, FileText, Package, ShieldCheck, Check } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string; productSlug: string }>;
}

export async function generateStaticParams(): Promise<{ username: string; productSlug: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("slug, profiles!products_creator_id_fkey(store_slug)")
    .eq("is_published", true)
    .limit(200);
  return (data ?? []).flatMap((p) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    const storeSlug = (profile as { store_slug?: string | null })?.store_slug;
    if (!storeSlug || !p.slug) return [];
    return [{ username: storeSlug as string, productSlug: p.slug as string }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, productSlug } = await params;
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("profiles")
    .select("id, store_name")
    .eq("store_slug", username)
    .single<Pick<Profile, "id" | "store_name">>();
  if (!creator) return {};
  const { data: product } = await supabase
    .from("products")
    .select("title, summary, cover_image_url")
    .eq("slug", productSlug)
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .single<Pick<Product, "title" | "summary" | "cover_image_url">>();
  if (!product) return {};
  return {
    title: `${product.title} — ${creator.store_name ?? username}`,
    description: product.summary ?? undefined,
    openGraph: {
      title: product.title,
      description: product.summary ?? undefined,
      images: product.cover_image_url ? [product.cover_image_url] : [],
    },
  };
}

function getFileTypeLabel(fileName: string | null) {
  if (!fileName) return "Digital product";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "PDF Document",
    zip: "ZIP Bundle",
    epub: "EPUB eBook",
    mp4: "MP4 Video",
    mp3: "MP3 Audio",
    psd: "Photoshop File",
    fig: "Figma File",
  };
  return map[ext] ?? `${ext.toUpperCase()} File`;
}

export default async function ProductPage({ params }: Props) {
  const { username, productSlug } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, store_slug, avatar_url, store_accent_color")
    .eq("store_slug", username)
    .single<Pick<Profile, "id" | "full_name" | "store_name" | "store_slug" | "avatar_url" | "store_accent_color">>();

  if (!creator) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", productSlug)
    .eq("creator_id", creator.id)
    .eq("is_published", true)
    .single<Product>();

  if (!product) notFound();

  // Fetch reviews
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  const storeName = creator.store_name ?? creator.full_name ?? "Creator";
  const accentColor = creator.store_accent_color ?? "#000000";

  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-indigo-100">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
          <Link
            href={`/${username}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {storeName}
          </Link>
          <div className="flex items-center gap-3">
            {creator.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt={storeName} className="w-8 h-8 rounded-full border border-gray-100" />
            )}
            <span className="text-sm font-bold text-gray-900">{storeName}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24">
          {/* ── LEFT: Visual & Story ── */}
          <div className="space-y-10">
            {/* Header */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
                {product.title}
              </h1>
              {product.summary && (
                <p className="text-xl text-gray-500 mt-4 leading-relaxed max-w-2xl">{product.summary}</p>
              )}
            </div>

            {/* Cover image */}
            {product.cover_image_url ? (
              <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 ring-1 ring-gray-900/5 hover:scale-[1.02] transition-transform duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.cover_image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-200" />
              </div>
            )}

            {/* Rich text description */}
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
              {product.description ? (
                <article
                  className="prose prose-lg prose-gray max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                    prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-a:text-indigo-600 prose-a:underline hover:prose-a:text-indigo-800
                    prose-img:rounded-2xl prose-img:shadow-md
                    prose-ul:text-gray-600 prose-ol:text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-gray-500 italic">No description provided.</p>
              )}
            </div>
          </div>

          {/* ── RIGHT: Conversion & Reviews ── */}
          <div className="lg:sticky lg:top-24 space-y-8 pb-20 self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-4 custom-scrollbar">
            
            {/* CTA Box */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 ring-1 ring-black/5">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">You will receive</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <Download className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Instant Access</p>
                        <p className="text-sm text-gray-500 mt-0.5">Secure download link sent instantly via email.</p>
                      </div>
                    </li>
                    {product.file_name && (
                      <li className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{getFileTypeLabel(product.file_name)}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            High quality original file
                            {product.file_size_bytes ? ` (${formatFileSize(product.file_size_bytes)})` : ""}
                          </p>
                        </div>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Secure Payment</p>
                        <p className="text-sm text-gray-500 mt-0.5">Bank-level encryption via Cashfree.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <ProductCTA
                    productId={product.id}
                    pricePaise={product.price_paise}
                    creatorId={creator.id}
                    storeSlug={username}
                    productSlug={productSlug}
                    ctaText={product.cta_text}
                    accentColor={accentColor}
                  />
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400">
                    <Check className="w-3 h-3 text-green-500" />
                    Trusted by <span className="text-gray-600">{(product.total_sales || 0) + 24}</span> creators & buyers
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 ring-1 ring-black/5">
              <ProductReviews 
                productId={product.id} 
                initialReviews={reviews || []} 
                accentColor={accentColor}
                maxReviewsDisplayed={product.max_reviews_displayed ?? 10}
              />
            </div>

          </div>
        </div>
      </main>

      <PageViewTracker productId={product.id} creatorId={creator.id} />
    </div>
  );
}
