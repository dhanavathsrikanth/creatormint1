import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, FeatureRequest, FeatureStatus } from "@/types/database";
import { AdminRoadmapClient } from "@/components/admin/AdminRoadmapClient";
import { Map } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roadmap Management — Admin" };
export const revalidate = 0;

export default async function AdminRoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<Pick<Profile, "role">>();
  if (profile?.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: requests } = await admin
    .from("feature_requests")
    .select("*")
    .order("vote_count", { ascending: false })
    .returns<FeatureRequest[]>();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
          <Map className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Roadmap Management</h1>
          <p className="text-xs text-muted-foreground">{requests?.length ?? 0} total requests</p>
        </div>
      </div>
      <AdminRoadmapClient initialRequests={requests ?? []} />
    </div>
  );
}
