import { Download, Package, Wheat, Users, ClipboardList, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sheetConfigured } from "@/lib/gsheet";
import { ImportPanel } from "./import-panel";
import { SyncPanel } from "./sync-panel";

export const dynamic = "force-dynamic";
// Google Sheets calls are slow; "Sinkron Semua" runs many sequentially.
export const maxDuration = 60;

const EXPORTS = [
  { type: "produk", label: "Produk", icon: Package },
  { type: "bahan", label: "Bahan Baku", icon: Wheat },
  { type: "pelanggan", label: "Pelanggan", icon: Users },
  { type: "pesanan", label: "Pesanan", icon: ClipboardList },
  { type: "pembayaran", label: "Pembayaran", icon: Wallet },
];

export default function LaporanPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Unduh data ke Excel, atau impor data secara massal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-5 text-primary" />
            Export ke Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {EXPORTS.map((e) => {
              const Icon = e.icon;
              return (
                <Button key={e.type} asChild variant="outline" className="justify-start">
                  <a href={`/api/export/${e.type}`}>
                    <Icon />
                    {e.label}
                  </a>
                </Button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            File .xlsx bisa dibuka di Excel atau Google Sheets.
          </p>
        </CardContent>
      </Card>

      <ImportPanel />

      <SyncPanel configured={sheetConfigured()} />
    </div>
  );
}
