import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { BuyerShell } from "@/components/buyer/BuyerShell";

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/auth/login");
  // Creators and admins go to their own dashboards
  if (profile.role === "creator") redirect("/dashboard");
  if (profile.role === "admin") redirect("/admin");

  return <BuyerShell profile={profile}>{children}</BuyerShell>;
}
