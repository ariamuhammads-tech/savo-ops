import { cookies } from "next/headers";

/**
 * Mode Demo (latihan): when the cookie is set, every Supabase query in the
 * app runs against the parallel "demo" schema (see lib/supabase/server.ts and
 * migration 0013) — real data can't be touched, and demo.reset_demo() wipes
 * the sandbox on both start and end of a session.
 */
export const DEMO_COOKIE = "savo-demo";

export async function isDemoMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value === "1";
}
