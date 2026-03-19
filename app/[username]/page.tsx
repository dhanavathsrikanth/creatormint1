import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { BlockRenderer } from "@/components/storefront/BlockRenderer";
import { PageViewTracker } from "@/components/storefront/PageViewTracker";
import { TEMPLATES } from "@/lib/templates";
import { seedDefaultStore } from "@/lib/store-builder/seed";
import type { Metadata } from "next";
import type React from "react";

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateStaticParams(): Promise<{ username: string }[]> {
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
    title: `${name} — CreatorMint`,
    description: profile.store_description ?? `Buy digital products from ${name} on CreatorMint.`,
    openGraph: {
      title: name,
      description: profile.store_description ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("store_slug", username)
    .eq("onboarding_complete", true)
    .single<Profile>();

  if (!profile) notFound();

  // Parallel fetch — all data at once, never waterfall
  const [
    { data: storeConfig },
    { data: rawBlocks },
    { data: products },
  ] = await Promise.all([
    supabase.from("store_configs").select("*").eq("creator_id", profile.id).single(),
    supabase
      .from("store_blocks")
      .select("*")
      .eq("creator_id", profile.id)
      .eq("is_visible", true)
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("id, title, slug, summary, price_paise, cover_image_url, total_sales, product_type, file_url")
      .eq("creator_id", profile.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .returns<Pick<Product, "id" | "title" | "slug" | "summary" | "price_paise" | "cover_image_url" | "total_sales" | "product_type">[]>(),
  ]);

  // If no blocks exist yet, seed defaults for this creator (background, no await so page doesn't block)
  if (!rawBlocks || rawBlocks.length === 0) {
    void seedDefaultStore(profile.id);
  }

  // Blocks — either from DB or minimal fallback for immediate render
  const blocks = rawBlocks && rawBlocks.length > 0
    ? rawBlocks
    : [
        { id: "hero-fallback",    block_type: "hero",         position: 0, is_visible: true, config: { layout: "centred", showTagline: true } },
        { id: "grid-fallback",    block_type: "product_grid", position: 1, is_visible: true, config: { columns: 3 } },
      ];

  // Resolve template
  const template = TEMPLATES[storeConfig?.template_id ?? "minimal"] ?? TEMPLATES.minimal;

  // Merge: template defaults → creator overrides. Creator always wins.
  const finalStyles = {
    ...template.defaults,
    ...(storeConfig?.custom_styles ?? {}),
  };

  // Convert to React.CSSProperties for the wrapper div
  const cssVariables = Object.entries(finalStyles).reduce((acc, [key, value]) => {
    (acc as Record<string, string>)[key] = value;
    return acc;
  }, {} as React.CSSProperties);

  return (
    <div style={cssVariables} className="store-page">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          profile={profile}
          products={products ?? []}
          storeSlug={username}
        />
      ))}

      {/* Powered-by footer — only shown on free plan */}
      {(!profile.plan_tier || profile.plan_tier === "free") && (
        <footer className="store-powered-by">
          <a href="https://creatorMint.in" target="_blank" rel="noopener noreferrer">
            Powered by CreatorMint
          </a>
        </footer>
      )}

      <PageViewTracker creatorId={profile.id} />
    </div>
  );
}
