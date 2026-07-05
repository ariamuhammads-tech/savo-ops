import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { DEMO_COOKIE } from "@/lib/demo";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth session via cookies.
 *
 * Mode Demo: when the "savo-demo" cookie is set, ALL queries from this client
 * run against the parallel `demo` schema (structural clone of public, see
 * migration 0013) — the whole app becomes a training sandbox with real logic
 * but zero risk to real data. The cast keeps the generated public types.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get(DEMO_COOKIE)?.value === "1";

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: (isDemo ? "demo" : "public") as "public" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore when middleware
            // is refreshing sessions.
          }
        },
      },
    },
  );
}
