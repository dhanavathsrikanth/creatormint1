import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { OnboardingClient } from "@/components/onboarding-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Set up your store" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/auth/login");
  if (profile.role !== "creator") redirect("/account");
  if (profile.onboarding_complete) redirect("/dashboard");

  return (
    <OnboardingClient
      userId={user.id}
      currentStep={profile.onboarding_step ?? 1}
      initialStoreName={profile.store_name}
      initialSlug={profile.store_slug}
      initialDescription={profile.store_description}
      initialUpi={profile.upi_id}
    />
  );
}
