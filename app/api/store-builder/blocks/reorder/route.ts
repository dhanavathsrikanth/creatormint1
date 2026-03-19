import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** PATCH /api/store-builder/blocks/reorder — bulk update block positions */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blocks } = await request.json();

  // Supabase doesn't support bulk updates with different values per row,
  // so we run them in parallel.
  await Promise.all(
    (blocks as { id: string; position: number }[]).map((block) =>
      supabase
        .from("store_blocks")
        .update({ position: block.position })
        .eq("id", block.id)
        .eq("creator_id", user.id)
    )
  );

  return NextResponse.json({ ok: true });
}
