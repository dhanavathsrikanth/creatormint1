import { createClient } from "@/lib/supabase/server";
import type { FeatureRequest, Profile } from "@/types/database";
import { FeatureBoard } from "@/components/roadmap/FeatureBoard";
import { NewRequestForm } from "@/components/roadmap/NewRequestForm";
import { Rocket } from "lucide-react";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Roadmap — CreatorMint",
  description: "Vote on features and help us decide what to build next.",
};

export const revalidate = 60;

export default async function RoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let userVotes: Record<string, "up" | "down"> = {};

  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
    profile = data;

    const { data: votes } = await supabase
      .from("feature_request_votes")
      .select("request_id, vote_type")
      .eq("user_id", user.id);

    userVotes = Object.fromEntries(
      (votes ?? []).map((v) => [v.request_id, v.vote_type as "up" | "down"])
    );
  }

  const { data: requests } = await supabase
    .from("feature_requests")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<FeatureRequest[]>();

  const totalVotes = (requests ?? []).reduce((acc, r) => acc + r.vote_count, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
            <Rocket className="w-3.5 h-3.5" />
            Public Roadmap
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 leading-tight">
            Help us build what matters
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Share your ideas, vote on what others have suggested, and watch us build the features that matter most to you.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-black text-foreground">{(requests ?? []).length}</p>
              <p className="text-xs text-muted-foreground font-medium">Ideas submitted</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-foreground">{totalVotes}</p>
              <p className="text-xs text-muted-foreground font-medium">Total votes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <NewRequestForm isLoggedIn={!!user} />
        <FeatureBoard
          initialRequests={requests ?? []}
          initialUserVotes={userVotes}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
