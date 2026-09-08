import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const hasLocalSession = cookieStore.get("savo_session")?.value === "1";

  let userEmail: string | undefined = hasLocalSession ? "thesavorium@gmail.com" : undefined;
  let demo = false;

  try {
    const supabase = await createClient();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1000),
    );
    const userPromise = supabase.auth
      .getUser()
      .then((res) => res.data?.user ?? null)
      .catch(() => null);

    const user = await Promise.race([userPromise, timeoutPromise]);
    if (user) {
      userEmail = user.email;
    }
    demo = await isDemoMode().catch(() => false);
  } catch {
    // Supabase unreachable/paused fallback
  }

  if (!userEmail && !hasLocalSession) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={userEmail ?? "thesavorium@gmail.com"} isDemo={demo}>
      {children}
    </AppShell>
  );
}
