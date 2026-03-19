import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types/database";

/** GET /api/products — list all products for the authenticated creator */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Product[]>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

/** POST /api/products — create a draft product and return it */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = (body.title as string | undefined) ?? "Untitled Product";
  const baseSlug = slugify(title) || `product-${Date.now()}`;

  // Ensure slug is unique for this creator
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("creator_id", user.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${++counter}`;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      creator_id: user.id,
      title,
      slug,
      is_published: false,
      price_paise: 0,
    })
    .select()
    .single<Product>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product }, { status: 201 });
}
