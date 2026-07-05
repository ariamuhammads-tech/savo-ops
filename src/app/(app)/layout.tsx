import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    demo,
  ] = await Promise.all([supabase.auth.getUser(), isDemoMode()]);

  if (!user) redirect("/login");

  return (
    <AppShell userEmail={user.email} isDemo={demo}>
      {children}
    </AppShell>
  );
}
