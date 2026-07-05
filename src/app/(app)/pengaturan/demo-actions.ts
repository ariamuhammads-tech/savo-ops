"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/demo";

/**
 * Mode Demo (latihan): the sandbox is wiped + re-seeded from real master data
 * on START (always begin clean) and wiped again on END (nothing persists).
 */

export async function startDemoMode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const store = await cookies();
  store.set(DEMO_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // Safety net: auto-expire after 12 hours even if never ended manually.
    maxAge: 60 * 60 * 12,
  });

  // Cookie is set → this client now talks to the demo schema.
  const demoClient = await createClient();
  const { error } = await demoClient.rpc("reset_demo");
  if (error) {
    store.delete(DEMO_COOKIE);
    redirect(
      "/pengaturan?err=" +
        encodeURIComponent("Gagal menyiapkan Mode Demo: " + error.message),
    );
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function endDemoMode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const store = await cookies();
  if (store.get(DEMO_COOKIE)?.value === "1") {
    // Wipe the sandbox while the cookie still points this client at demo.
    const demoClient = await createClient();
    await demoClient.rpc("reset_demo");
    store.delete(DEMO_COOKIE);
  }

  revalidatePath("/", "layout");
  redirect(
    "/pengaturan?msg=" +
      encodeURIComponent("Mode demo selesai. Semua data latihan dihapus."),
  );
}
