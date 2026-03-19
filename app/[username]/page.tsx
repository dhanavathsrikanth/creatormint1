import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { StoreHero } from "@/components/storefront/StoreHero";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import type { Metadata } from "next";

// ── ISR: revalidate store pages every 60 seconds ──────────────────
export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

// ── Pre-generate popular store routes at build time ───────────────
export async function generateStaticParams(): Promise<{ username: string }[]> {
  // Admin client doesn't call cookies() — safe to use at build time
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("store_slug")
    .eq("onboarding_complete", true)
    .not("store_slug", "is", null)
    .limit(100);
  return (data ?? []).flatMap((p) =>
    p.store_slug ? [{ username: p.store_slug as string }] : []
  );
}

// ── SEO metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("store_name, store_description, avatar_url")
    .eq("store_slug", username)
    .eq("onboarding_complete", true)
    .single<Pick<Profile, "store_name" | "store_description" | "avatar_url">>();

  if (!profile) return { title: "Store not found" };

  const name = profile.store_name ?? username;
  return {
    title: `${name} — Digital Products on CreatorMint`,
    description: profile.store_description ?? `Buy digital products from ${name} on CreatorMint.`,
    openGraph: {
      title: name,
      description: profile.store_description ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────
export default async function StorePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, store_name, store_description, store_slug, avatar_url, store_accent_color, total_sales")
    .eq("store_slug", username)
    .eq("onboarding_complete", true)
    .single<Pick<Profile, "id" | "full_name" | "store_name" | "store_description" | "store_slug" | "avatar_url" | "store_accent_color" | "total_sales">>();

  if (!profile) notFound();

  const { data: products = [] } = await supabase
    .from("products")
    .select("id, title, slug, summary, price_paise, cover_image_url, total_sales, file_name")
    .eq("creator_id", profile.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .returns<Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales" | "file_name">[]>();

  return (
    <>
      <StoreHero profile={profile} productCount={(products ?? []).length} />
      <ProductGrid products={products ?? []} storeSlug={username} />
      <PageViewTracker creatorId={profile.id} />
    </>
  );
}
