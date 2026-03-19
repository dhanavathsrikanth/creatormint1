import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** PATCH /api/store-builder/config — update template_id or custom_styles */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["template_id", "custom_styles"];
  const update: Record<string, unknown> = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("store_configs")
    .upsert({ creator_id: user.id, ...update }, { onConflict: "creator_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
