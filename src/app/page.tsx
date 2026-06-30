import { LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-primary">
              SAVO
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Ops
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              <LogOut />
              Keluar
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Dasbor
          </h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang{user?.email ? `, ${user.email}` : ""}.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="size-5 text-primary" />
              Aplikasi siap digunakan
            </CardTitle>
            <CardDescription>
              Ini adalah kerangka awal SAVO Ops (Phase 0). Fitur penjualan,
              produk, resep &amp; HPP, stok, dan invoice akan ditambahkan pada
              tahap berikutnya setelah Anda menyetujui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Anda berhasil masuk. Login, proteksi halaman, dan koneksi database
              sudah berfungsi.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
