import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/products/slug-check?slug=my-slug&excludeId=product-uuid
 * Returns { available: boolean } for the authenticated creator's slug namespace.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const excludeId = searchParams.get("excludeId")?.trim() ?? "";

  if (!slug) return NextResponse.json({ available: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ available: false }, { status: 401 });

  // RLS already scopes to creator_id = auth.uid()
  let query = supabase
    .from("products")
    .select("id")
    .eq("slug", slug);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query.maybeSingle();

  return NextResponse.json({ available: !data });
}
