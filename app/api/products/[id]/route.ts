import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/products/[id] — fetch one product (creator only) */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user.id)
    .single<Product>();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

/** PATCH /api/products/[id] — update product fields (creator only via RLS) */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Whitelist updatable fields — never allow creator_id or id to change
  const ALLOWED: (keyof Product)[] = [
    "title", "slug", "summary", "description", "price_paise",
    "cover_image_url", "file_key", "file_name", "file_size_bytes", "is_published",
  ];

  const payload: Partial<Record<keyof Product, unknown>> = {};
  for (const key of ALLOWED) {
    if (key in body) payload[key] = body[key as string];
  }

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // RLS UPDATE policy enforces creator_id = auth.uid()
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select()
    .single<Product>();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already taken", code: "slug_conflict" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

/** DELETE /api/products/[id] — delete product (creator only) */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
