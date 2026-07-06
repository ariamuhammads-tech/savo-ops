import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentMonth, shiftMonth, monthLabel, inMonth } from "../bulan";

export const metadata: Metadata = { title: "Pengeluaran · SAVO Ops" };
export const dynamic = "force-dynamic";

const PEMBELIAN = "Pembelian bahan";

type Entry = {
  id: string;
  date: string;
  label: string;
  category: string;
  amount: number;
  href?: string;
};

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; urut?: string; kategori?: string }>;
}) {
  const sp = await searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(sp.bulan ?? "") ? sp.bulan! : currentMonth();
  const asc = sp.urut === "asc";
  const kategori = (sp.kategori ?? "").trim();

  const supabase = await createClient();
  const [{ data: purchases }, { data: expenses }] = await Promise.all([
    supabase
      .from("purchases")
      .select("id, purchase_no, supplier_name, total, purchase_date")
      .order("purchase_date", { ascending: false })
      .limit(500),
    supabase
      .from("expenses")
      .select("id, expense_date, category, description, amount")
      .order("expense_date", { ascending: false })
      .limit(500),
  ]);

  const all: Entry[] = [
    ...(purchases ?? []).map((p) => ({
      id: `pb-${p.id}`,
      date: String(p.purchase_date),
      label: `${p.purchase_no}${p.supplier_name ? ` · ${p.supplier_name}` : ""}`,
      category: PEMBELIAN,
      amount: Number(p.total),
      href: `/pembelian/${p.id}`,
    })),
    ...(expenses ?? []).map((e) => ({
      id: `ex-${e.id}`,
      date: String(e.expense_date),
      label: e.description || "(tanpa keterangan)",
      category: e.category || "Operasional",
      amount: Number(e.amount),
    })),
  ];

  // Kategori akun untuk filter — dari data yang benar-benar ada.
  const categories = [...new Set(all.map((e) => e.category))].sort();

  const rows = all
    .filter((e) => inMonth(e.date, bulan))
    .filter((e) => !kategori || e.category === kategori)
    .sort((a, b) => (asc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const total = rows.reduce((s, e) => s + e.amount, 0);

  const qs = (over: { bulan?: string; kategori?: string; urut?: string }) => {
    const params = new URLSearchParams();
    params.set("bulan", over.bulan ?? bulan);
    const k = over.kategori ?? kategori;
    if (k) params.set("kategori", k);
    const u = over.urut ?? (asc ? "asc" : "");
    if (u) params.set("urut", u);
    return `/keuangan/pengeluaran?${params.toString()}`;
  };

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
          <TrendingDown className="size-6 text-destructive" />
          Pengeluaran
        </h1>
        <p className="text-sm text-muted-foreground">
          Pembelian bahan + pengeluaran operasional, urut tanggal.
        </p>
      </div>

      {/* Month nav + sort */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <Link href={qs({ bulan: shiftMonth(bulan, -1) })} className="rounded-lg p-1.5 hover:bg-secondary" aria-label="Bulan sebelumnya">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="px-2 text-sm font-medium">{monthLabel(bulan)}</span>
          <Link href={qs({ bulan: shiftMonth(bulan, 1) })} className="rounded-lg p-1.5 hover:bg-secondary" aria-label="Bulan berikutnya">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <Link
          href={qs({ urut: asc ? "" : "asc" })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary"
        >
          <ArrowUpDown className="size-4" />
          {asc ? "Terlama dulu" : "Terbaru dulu"}
        </Link>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={qs({ kategori: "" })}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium",
            !kategori ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={qs({ kategori: c })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              kategori === c ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground",
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">
            {rows.length} transaksi · {monthLabel(bulan)}
            {kategori ? ` · ${kategori}` : ""}
          </span>
          <span className="font-serif text-xl font-bold text-destructive">
            −{formatIDR(total)}
          </span>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Tidak ada pengeluaran pada {monthLabel(bulan)}
          {kategori ? ` untuk kategori ${kategori}` : ""}.
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border">
              {rows.map((e) => {
                const inner = (
                  <div className="flex w-full items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{e.category}</Badge>
                      <span className="text-sm font-medium text-destructive">
                        −{formatIDR(e.amount)}
                      </span>
                    </div>
                  </div>
                );
                return (
                  <li key={e.id}>
                    {e.href ? (
                      <Link href={e.href} className="block hover:opacity-80">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
