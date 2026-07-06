import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentMonth, shiftMonth, monthLabel, inMonth } from "../bulan";

export const metadata: Metadata = { title: "Laba Rugi · SAVO Ops" };
export const dynamic = "force-dynamic";

export default async function LabaRugiPage() {
  const supabase = await createClient();
  const [{ data: payments }, { data: purchases }, { data: expenses }] =
    await Promise.all([
      supabase.from("payments").select("amount, status, paid_at").eq("status", "settled"),
      supabase.from("purchases").select("total, purchase_date"),
      supabase.from("expenses").select("amount, expense_date"),
    ]);

  // 6 bulan terakhir, terbaru di atas.
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth(), -i));

  const rows = months.map((ym) => {
    const masuk = (payments ?? [])
      .filter((p) => inMonth(p.paid_at, ym))
      .reduce((s, p) => s + Number(p.amount), 0);
    const beli = (purchases ?? [])
      .filter((p) => inMonth(p.purchase_date, ym))
      .reduce((s, p) => s + Number(p.total), 0);
    const ops = (expenses ?? [])
      .filter((e) => inMonth(e.expense_date, ym))
      .reduce((s, e) => s + Number(e.amount), 0);
    return { ym, masuk, beli, ops, laba: masuk - beli - ops };
  });

  const totals = rows.reduce(
    (a, r) => ({
      masuk: a.masuk + r.masuk,
      beli: a.beli + r.beli,
      ops: a.ops + r.ops,
      laba: a.laba + r.laba,
    }),
    { masuk: 0, beli: 0, ops: 0, laba: 0 },
  );

  const now = rows[0];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/keuangan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Keuangan
      </Link>

      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
          <Scale className="size-6 text-primary" />
          Laporan Laba Rugi
        </h1>
        <p className="text-sm text-muted-foreground">
          Pemasukan − pembelian bahan − operasional, per bulan (6 bulan terakhir).
        </p>
      </div>

      {/* Bulan berjalan */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{monthLabel(now.ym)} (berjalan)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Baris label="Pemasukan" value={formatIDR(now.masuk)} plus />
          <Baris label="Pembelian bahan" value={`−${formatIDR(now.beli)}`} />
          <Baris label="Operasional" value={`−${formatIDR(now.ops)}`} />
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Laba bersih</span>
            <span
              className={cn(
                "font-serif text-xl font-bold",
                now.laba < 0 ? "text-destructive" : "text-[color:var(--success)]",
              )}
            >
              {formatIDR(now.laba)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabel 6 bulan */}
      <Card>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Bulan</th>
                <th className="px-2 py-1.5 text-right font-medium">Masuk</th>
                <th className="px-2 py-1.5 text-right font-medium">Keluar</th>
                <th className="py-1.5 pl-2 text-right font-medium">Laba</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ym} className="border-b border-border/60">
                  <td className="py-2 pr-2 font-medium">{monthLabel(r.ym)}</td>
                  <td className="px-2 py-2 text-right text-[color:var(--success)]">
                    {formatIDR(r.masuk)}
                  </td>
                  <td className="px-2 py-2 text-right text-destructive">
                    {formatIDR(r.beli + r.ops)}
                  </td>
                  <td
                    className={cn(
                      "py-2 pl-2 text-right font-medium",
                      r.laba < 0 ? "text-destructive" : "text-[color:var(--success)]",
                    )}
                  >
                    {formatIDR(r.laba)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-2 font-semibold">Total 6 bulan</td>
                <td className="px-2 py-2 text-right font-medium">{formatIDR(totals.masuk)}</td>
                <td className="px-2 py-2 text-right font-medium">
                  {formatIDR(totals.beli + totals.ops)}
                </td>
                <td
                  className={cn(
                    "py-2 pl-2 text-right font-semibold",
                    totals.laba < 0 ? "text-destructive" : "text-[color:var(--success)]",
                  )}
                >
                  {formatIDR(totals.laba)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Catatan: pengeluaran dihitung saat terjadi (termasuk belanja stok),
            jadi bulan dengan belanja besar bisa tampak rugi walau stoknya masih
            bernilai. Selisih opname ikut terhitung di Operasional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Baris({ label, value, plus }: { label: string; value: string; plus?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={plus ? "text-[color:var(--success)]" : "text-destructive"}>
        {plus ? "+" : ""}
        {value}
      </span>
    </div>
  );
}
