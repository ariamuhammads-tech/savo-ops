"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

import { syncSheet, type SyncType } from "./sync-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SyncPanel({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [busyType, setBusyType] = useState<SyncType | null>(null);

  function run(type: SyncType) {
    setBusyType(type);
    startTransition(async () => {
      const res = await syncSheet(type);
      setBusyType(null);
      if (res.ok) {
        toast.success(
          `Sinkron ${type}: ${res.pulled} dari Sheet, ${res.pushed} ke Sheet.`,
        );
      } else {
        toast.error(res.error ?? "Gagal sinkron.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="size-5 text-primary" />
          Sinkron Google Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured ? (
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
            Google Sheets belum dihubungkan. Ikuti panduan setup dari admin
            (tempel skrip ke Sheet &amp; isi env di Netlify), lalu sinkron akan
            aktif.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sinkron dua arah (yang terbaru menang). Aman: baris tidak pernah
            dihapus otomatis.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!configured || pending}
            onClick={() => run("produk")}
          >
            {pending && busyType === "produk" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            Sinkron Produk
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!configured || pending}
            onClick={() => run("bahan")}
          >
            {pending && busyType === "bahan" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            Sinkron Bahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
