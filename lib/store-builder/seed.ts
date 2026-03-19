// lib/store-builder/seed.ts
// Called after onboarding_complete is set. Gives every creator a working store.

import { createAdminClient } from "@/lib/supabase/admin";

export async function seedDefaultStore(creatorId: string) {
  const admin = createAdminClient();

  // Upsert — safe to call multiple times
  await admin.from("store_configs").upsert(
    { creator_id: creatorId, template_id: "minimal", custom_styles: {} },
    { onConflict: "creator_id" }
  );

  // Check if blocks already exist
  const { data: existing } = await admin
    .from("store_blocks")
    .select("id")
    .eq("creator_id", creatorId)
    .limit(1);

  if (existing && existing.length > 0) return; // already seeded

  await admin.from("store_blocks").insert([
    {
      creator_id: creatorId,
      block_type: "hero",
      position: 0,
      is_visible: true,
      config: { showTagline: true, showSocials: true, layout: "centred" },
    },
    {
      creator_id: creatorId,
      block_type: "product_grid",
      position: 1,
      is_visible: true,
      config: { columns: 3 },
    },
    {
      creator_id: creatorId,
      block_type: "lead_magnet",
      position: 2,
      is_visible: false,
      config: {},
    },
    {
      creator_id: creatorId,
      block_type: "about",
      position: 3,
      is_visible: false,
      config: { content: "" },
    },
  ]);
}
