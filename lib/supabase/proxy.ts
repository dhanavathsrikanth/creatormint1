import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If env vars are missing skip all checks (dev setup mode)
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // IMPORTANT: Do not put code between createServerClient and getClaims()
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    const { pathname } = request.nextUrl;

    // Routes that REQUIRE authentication — everything else is public by default.
    // This lets /[username] creator stores be accessible without login.
    const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/account"];
    const requiresAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

    if (!user && requiresAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // Logged-in: drive routing based on role + onboarding status
    if (user?.sub) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_complete")
        .eq("id", user.sub)
        .maybeSingle<{ role: string; onboarding_complete: boolean }>();

      const role = profile?.role ?? "buyer";
      const onboardingComplete = profile?.onboarding_complete ?? false;

      // Redirect logged-in users away from auth pages
      if (pathname.startsWith("/auth")) {
        const url = request.nextUrl.clone();
        url.pathname =
          role === "creator"
            ? onboardingComplete
              ? "/dashboard"
              : "/onboarding"
            : "/account";
        return NextResponse.redirect(url);
      }

      // Creator routing
      if (role === "creator") {
        if (!onboardingComplete && !pathname.startsWith("/onboarding")) {
          const url = request.nextUrl.clone();
          url.pathname = "/onboarding";
          return NextResponse.redirect(url);
        }
        if (onboardingComplete && pathname.startsWith("/onboarding")) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
        if (pathname.startsWith("/account")) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return NextResponse.redirect(url);
        }
      }

      // Buyer routing
      if (role === "buyer") {
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/onboarding")
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/account";
          return NextResponse.redirect(url);
        }
      }
    }
  } catch (err) {
    // If anything in the middleware blows up, just pass the request through
    // rather than returning a 500. Errors here would be unexpected (network issues
    // with Supabase, etc.) and should not block page rendering.
    console.error("[middleware] Unexpected error:", err);
  }

  return supabaseResponse;
}

