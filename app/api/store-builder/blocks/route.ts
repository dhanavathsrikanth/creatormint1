import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST /api/store-builder/blocks — add a new block */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { block_type, position } = await request.json();

  const { data, error } = await supabase
    .from("store_blocks")
    .insert({
      creator_id: user.id,
      block_type,
      position,
      is_visible: true,
      config: {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
