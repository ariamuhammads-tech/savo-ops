import type { Metadata } from "next";
import { Sparkles, KeyRound } from "lucide-react";

import { geminiConfigured } from "@/lib/gemini";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssistantPanel } from "./assistant-panel";

export const metadata: Metadata = { title: "Asisten AI · SAVO Ops" };
export const dynamic = "force-dynamic";
// AI analysis of a few hundred rows can exceed Vercel's 10s default.
export const maxDuration = 60;

export default function AsistenPage() {
  const ready = geminiConfigured();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
          <Sparkles className="size-6 text-primary" />
          Asisten AI
        </h1>
        <p className="text-sm text-muted-foreground">
          Rapikan data secara otomatis: AI mengusulkan, Anda menyetujui. Tidak ada
          data yang diubah tanpa persetujuan.
        </p>
      </div>

      {ready ? (
        <AssistantPanel />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-5 text-warning" />
              Perlu API key Gemini (gratis)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Asisten AI memakai Google Gemini tier gratis. Sekali setup saja:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Buka{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline"
                >
                  aistudio.google.com/apikey
                </a>{" "}
                (login akun Google) lalu klik <b>Create API key</b>.
              </li>
              <li>Salin key yang muncul (diawali &quot;AIza…&quot;).</li>
              <li>
                Buka <b>Vercel → project savo-ops → Settings → Environment
                Variables</b>, tambah variabel <b>GEMINI_API_KEY</b>, tempel key-nya,
                simpan.
              </li>
              <li>Deploy ulang (Deployments → ⋯ → Redeploy), lalu buka halaman ini lagi.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Gratis dengan batas pemakaian harian dari Google — cukup untuk
              pemakaian internal. Key hanya tersimpan di server, tidak pernah
              terlihat di browser.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
