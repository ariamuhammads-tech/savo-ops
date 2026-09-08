import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and guards routes.
 * Unauthenticated users are redirected to /login (except public paths).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/login" ||
    path.startsWith("/auth") ||
    path.startsWith("/api/health") ||
    path.startsWith("/api/hades") ||
    path.startsWith("/api/invoice");

  // Check local session cookie first for instant response (no Supabase DNS hang)
  const localSession = request.cookies.get("savo_session")?.value === "1";
  if (localSession) {
    if (path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Check Supabase session with strict 1s timeout to prevent hang on paused/offline Supabase
  let user = null;
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
    const userPromise = supabase.auth.getUser().then((res) => res.data?.user ?? null).catch(() => null);
    user = await Promise.race([userPromise, timeout]);
  } catch {
    user = null;
  }

  // Not logged in and trying to reach a protected page -> go to /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged in but visiting /login -> send to dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
