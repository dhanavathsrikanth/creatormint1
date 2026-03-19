import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";

/**
 * Creates a draft product immediately then redirects to the editor.
 * This way the editor ALWAYS has a product.id for auto-save / PATCH calls.
 */
export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const baseSlug = `untitled-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  // Ensure slug is unique for this creator
  while (true) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("creator_id", user.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    slug = `${baseSlug}-${++counter}`;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      creator_id: user.id,
      title: "Untitled Product",
      slug,
      is_published: false,
      price_paise: 0,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect("/dashboard/products");
  }

  redirect(`/dashboard/products/${product.id}/edit`);
}
