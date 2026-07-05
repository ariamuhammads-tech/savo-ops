import { Suspense } from "react";
import { FlaskConical } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { SettingsForm } from "./settings-form";
import { startDemoMode, endDemoMode } from "./demo-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton, ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const [{ data: settings }, demo] = await Promise.all([
    supabase.from("business_settings").select("*").limit(1).maybeSingle(),
    isDemoMode(),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Profil bisnis ini dipakai di invoice PDF.
        </p>
      </div>

      {/* ===== Mode Demo (latihan) ===== */}
      <Card className={demo ? "border-warning/60" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="size-5 text-warning" />
            Mode Demo (Latihan)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {demo ? (
            <>
              <p>
                Mode demo <b>sedang aktif</b>. Semua menu bekerja normal, tapi
                data yang dibuat hanya untuk latihan dan{" "}
                <b>akan dihapus saat demo diakhiri</b>.
              </p>
              <form action={endDemoMode}>
                <ConfirmSubmitButton
                  variant="destructive"
                  className="w-full sm:w-auto"
                  confirmText="Akhiri mode demo? Semua data latihan akan dihapus permanen."
                >
                  Akhiri Mode Demo &amp; Hapus Data Latihan
                </ConfirmSubmitButton>
              </form>
            </>
          ) : (
            <>
              <p>
                Untuk melatih staf baru tanpa risiko: seluruh aplikasi berjalan
                seperti biasa (pesanan, masak, stok, invoice), tapi di{" "}
                <b>dunia latihan terpisah</b> — data asli tidak tersentuh sama
                sekali. Saat mulai, data latihan diisi salinan produk, bahan,
                resep &amp; pelanggan yang sekarang; saat diakhiri, semua data
                latihan lenyap.
              </p>
              <form action={startDemoMode}>
                <SubmitButton
                  variant="secondary"
                  pendingText="Menyiapkan…"
                  className="w-full sm:w-auto"
                >
                  <FlaskConical />
                  Mulai Mode Demo
                </SubmitButton>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <SettingsForm settings={settings ?? null} />
    </div>
  );
}
