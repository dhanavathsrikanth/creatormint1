import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** PATCH /api/store-builder/blocks/[id] — update visibility or config */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["is_visible", "config", "position"];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const { error } = await supabase
    .from("store_blocks")
    .update(update)
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/store-builder/blocks/[id] — remove a block (hero blocked) */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: block } = await supabase
    .from("store_blocks")
    .select("block_type")
    .eq("id", id)
    .single();

  if (block?.block_type === "hero") {
    return NextResponse.json({ error: "Cannot delete the hero block" }, { status: 400 });
  }

  await supabase
    .from("store_blocks")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  return NextResponse.json({ ok: true });
}
