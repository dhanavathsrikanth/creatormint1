import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Profile } from "@/types/database";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user profile to determine role-based redirect
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_complete")
          .eq("id", user.id)
          .single<Pick<Profile, "role" | "onboarding_complete">>();

        // If caller provided a specific ?next= param, honour it
        if (next) {
          return NextResponse.redirect(`${requestUrl.origin}${next}`);
        }

        // Role-based routing
        if (profile?.role === "admin") {
          return NextResponse.redirect(`${requestUrl.origin}/admin`);
        }

        if (profile?.role === "buyer") {
          return NextResponse.redirect(`${requestUrl.origin}/buyer`);
        }

        if (profile?.role === "creator") {
          const dest = profile.onboarding_complete ? "/dashboard" : "/onboarding";
          return NextResponse.redirect(`${requestUrl.origin}${dest}`);
        }

        return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
      }
    }
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/auth/error?error=Could not authenticate`
  );
}
