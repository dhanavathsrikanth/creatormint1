import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { StoreBuilder } from "@/components/dashboard/StoreBuilder";
import { TEMPLATES } from "@/lib/templates";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Store Builder — CreatorMint" };

export default async function StoreBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/auth/login");
  if (profile.role !== "creator") redirect("/");

  const [{ data: storeConfig }, { data: blocks }] = await Promise.all([
    supabase.from("store_configs").select("*").eq("creator_id", user.id).single(),
    supabase
      .from("store_blocks")
      .select("*")
      .eq("creator_id", user.id)
      .order("position", { ascending: true }),
  ]);

  return (
    <StoreBuilder
      profile={profile}
      storeConfig={storeConfig}
      blocks={blocks ?? []}
      templates={TEMPLATES}
    />
  );
}
