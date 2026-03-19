import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { formatINR, calculateGST, formatFileSize } from "@/lib/utils";
import Link from "next/link";
import { CheckoutClient } from "@/components/checkout-client";
import { TrustBadges } from "@/components/storefront/TrustBadges";
import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import { ArrowLeft, Download, FileText, Package, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string; productSlug: string }>;
}

// ── Static params ─────────────────────────────────────────────────
export async function generateStaticParams(): Promise<{ username: string; productSlug: string }[]> {
  // Admin client: no cookies() call — safe at build time
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

// ── Metadata ──────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
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
    sketch: "Sketch File",
    xd: "Adobe XD File",
  };
  return map[ext] ?? `${ext.toUpperCase()} File`;
}

// ── Page ──────────────────────────────────────────────────────────
export default async function ProductPage({ params }: Props) {
  const { username, productSlug } = await params;
  const supabase = await createClient();

  // Get creator
  const { data: creator } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, store_slug, avatar_url, store_accent_color, upi_id, monthly_revenue_paise")
    .eq("store_slug", username)
    .eq("onboarding_complete", true)
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
  const storeName = creator.store_name ?? creator.full_name ?? "Creator";
  const accentColor = creator.store_accent_color ?? "#3ECF8E";

  return (
    <>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-14 flex items-center">
        <div className="max-w-5xl mx-auto px-6 w-full flex items-center justify-between">
          <Link
            href={`/${username}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {storeName}
          </Link>
          <Link href="/" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
            CreatorMint
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
          {/* ── LEFT: Product details ── */}
          <div className="space-y-8">
            {/* Cover image */}
            {product.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.cover_image_url}
                alt={product.title}
                className="w-full aspect-video object-cover rounded-2xl border border-gray-100 shadow-sm"
              />
            ) : (
              <div className="w-full aspect-video bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-200" />
              </div>
            )}

            {/* Title (mobile) */}
            <div className="lg:hidden">
              <h1
                className="text-3xl font-black text-gray-900 leading-tight"
                style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
              >
                {product.title}
              </h1>
              {product.summary && (
                <p className="text-gray-500 mt-2 leading-relaxed">{product.summary}</p>
              )}
            </div>

            {/* What you get */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-gray-900">What you get</h2>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Download className="w-4 h-4 text-indigo-500 shrink-0" />
                  Instant download after payment
                </li>
                {product.file_name && (
                  <li className="flex items-center gap-2.5 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    {getFileTypeLabel(product.file_name)}
                    {product.file_size_bytes ? ` · ${formatFileSize(product.file_size_bytes)}` : ""}
                  </li>
                )}
                <li className="flex items-center gap-2.5 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  GST invoice included
                </li>
              </ul>
            </div>

            {/* Rich text description rendered from Tiptap HTML */}
            {product.description && (
              <div>
                <h2 className="font-bold text-gray-900 mb-4">About this product</h2>
                <article
                  className="prose prose-gray prose-sm max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                    prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:rounded prose-code:px-1
                    prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:text-gray-500
                    prose-img:rounded-xl prose-img:border prose-img:border-gray-200
                    prose-ul:text-gray-600 prose-ol:text-gray-600
                    prose-li:marker:text-gray-400"
                  // Safe: content is creator-written from our own Tiptap editor
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Creator card */}
            <div className="border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
              {creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatar_url} alt={storeName} className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{storeName}</p>
                <Link href={`/${username}`} className="text-xs text-indigo-600 hover:underline">
                  View all products →
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Purchase card (sticky) ── */}
          <div className="lg:sticky lg:top-20 h-fit">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: accentColor }}
              />
              <div className="p-6 space-y-5">
                {/* Title (desktop) */}
                <div className="hidden lg:block">
                  <h1
                    className="text-[28px] font-black text-gray-900 leading-tight"
                    style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}
                  >
                    {product.title}
                  </h1>
                  {product.summary && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.summary}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div
                    className="text-4xl font-black"
                    style={{ color: accentColor }}
                  >
                    {formatINR(product.price_paise)}
                  </div>
                  <div className="space-y-1 mt-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Base price</span>
                      <span>{formatINR(gst.base)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span>{formatINR(gst.gst)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Price includes 18% GST</p>
                </div>

                {/* Checkout */}
                <CheckoutClient
                  productId={product.id}
                  productTitle={product.title}
                  pricePaise={product.price_paise}
                  creatorId={creator.id}
                  storeSlug={username}
                  productSlug={productSlug}
                />

                {/* Trust badges */}
                <div className="pt-4 border-t border-gray-100">
                  <TrustBadges />
                </div>
              </div>
            </div>

            {product.total_sales > 0 && (
              <p className="text-center text-xs text-gray-400 mt-3">
                🔥 {product.total_sales.toLocaleString("en-IN")} people already own this
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Analytics */}
      <PageViewTracker productId={product.id} creatorId={creator.id} />
    </>
  );
}
