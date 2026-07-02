"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2, RefreshCcw } from "lucide-react";

import { syncSheet, type SyncType } from "./sync-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TWOWAY: { type: SyncType; label: string }[] = [
  { type: "produk", label: "Produk" },
  { type: "bahan", label: "Bahan Baku" },
  { type: "pelanggan", label: "Pelanggan" },
];
const PUSH: { type: SyncType; label: string }[] = [
  { type: "pesanan", label: "Pesanan" },
  { type: "pembayaran", label: "Pembayaran" },
  { type: "pembelian", label: "Pembelian" },
  { type: "produksi", label: "Produksi" },
  { type: "invoice", label: "Invoice" },
  { type: "pengeluaran", label: "Pengeluaran" },
];

export function SyncPanel({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function run(type: SyncType, label: string) {
    setBusy(type);
    startTransition(async () => {
      const res = await syncSheet(type);
      setBusy(null);
      if (res.ok)
        toast.success(
          `${label}: ${res.pulled != null ? `${res.pulled} dari Sheet, ` : ""}${res.pushed} ke Sheet.`,
        );
      else toast.error(`${label}: ${res.error ?? "gagal"}`);
    });
  }
  function runAll() {
    setBusy("__all__");
    startTransition(async () => {
      const all = [...TWOWAY, ...PUSH];
      let done = 0;
      const failed: string[] = [];
      for (const item of all) {
        try {
          const res = await syncSheet(item.type);
          if (res.ok) done++;
          else failed.push(item.label);
        } catch {
          failed.push(item.label);
        }
      }
      setBusy(null);
      if (failed.length === 0) toast.success(`Sinkron semua selesai (${done} data).`);
      else toast.error(`Selesai ${done}, gagal: ${failed.join(", ")}`);
    });
  }

  const btn = (item: { type: SyncType; label: string }) => (
    <Button
      key={item.type}
      type="button"
      variant="outline"
      size="sm"
      disabled={!configured || pending}
      onClick={() => run(item.type, item.label)}
      className="justify-start"
    >
      {pending && busy === item.type ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {item.label}
    </Button>
  );

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
            Google Sheets belum dihubungkan. Setelah skrip &amp; env terpasang,
            sinkron akan aktif.
          </p>
        ) : (
          <>
            <Button
              type="button"
              disabled={pending}
              onClick={runAll}
              className="w-full"
            >
              {pending && busy === "__all__" ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
              Sinkron Semua
            </Button>

            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Dua arah (bisa diedit balik dari Sheets)
              </p>
              <div className="grid grid-cols-2 gap-2">{TWOWAY.map(btn)}</div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Ekspor ke Sheets (transaksi)
              </p>
              <div className="grid grid-cols-2 gap-2">{PUSH.map(btn)}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Yang terbaru menang; baris tidak dihapus otomatis. Tab dibuat
              otomatis di Google Sheet.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
