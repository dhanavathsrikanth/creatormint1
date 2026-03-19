import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Profile, Product } from "@/types/database";
import { ProductEditor } from "@/components/dashboard/product-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit product — CreatorMint" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) redirect("/auth/login");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single<Product>();

  if (!product) notFound();

  return (
    <ProductEditor
      userId={user.id}
      storeSlug={profile.store_slug}
      product={product}
    />
  );
}
