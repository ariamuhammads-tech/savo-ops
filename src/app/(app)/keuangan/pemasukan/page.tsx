import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currentMonth, shiftMonth, monthLabel, inMonth } from "../bulan";

export const metadata: Metadata = { title: "Pemasukan · SAVO Ops" };
export const dynamic = "force-dynamic";

const METHOD: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  other: "Lainnya",
};

export default async function PemasukanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; urut?: string }>;
}) {
  const sp = await searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(sp.bulan ?? "") ? sp.bulan! : currentMonth();
  const asc = sp.urut === "asc";

  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, method, paid_at, reference, order:orders(order_no, contact_name)")
    .eq("status", "settled")
    .order("paid_at", { ascending: asc })
    .limit(500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data ?? []) as any[]).filter((p) => inMonth(p.paid_at, bulan));
  const total = rows.reduce((s, p) => s + Number(p.amount), 0);

  const qs = (b: string) => `/keuangan/pemasukan?bulan=${b}${asc ? "&urut=asc" : ""}`;

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
          <TrendingUp className="size-6 text-[color:var(--success)]" />
          Pemasukan
        </h1>
        <p className="text-sm text-muted-foreground">
          Semua pembayaran yang diterima (status settled).
        </p>
      </div>

      {/* Month nav + sort */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          <Link href={qs(shiftMonth(bulan, -1))} className="rounded-lg p-1.5 hover:bg-secondary" aria-label="Bulan sebelumnya">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="px-2 text-sm font-medium">{monthLabel(bulan)}</span>
          <Link href={qs(shiftMonth(bulan, 1))} className="rounded-lg p-1.5 hover:bg-secondary" aria-label="Bulan berikutnya">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <Link
          href={`/keuangan/pemasukan?bulan=${bulan}${asc ? "" : "&urut=asc"}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary"
        >
          <ArrowUpDown className="size-4" />
          {asc ? "Terlama dulu" : "Terbaru dulu"}
        </Link>
      </div>

      <Card className="border-[color:var(--success)]/30">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-sm text-muted-foreground">
            {rows.length} transaksi · {monthLabel(bulan)}
          </span>
          <span className="font-serif text-xl font-bold text-[color:var(--success)]">
            {formatIDR(total)}
          </span>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Tidak ada pemasukan pada {monthLabel(bulan)}.
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.order?.order_no ?? "Pembayaran"}
                      {p.order?.contact_name ? ` · ${p.order.contact_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.paid_at)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{METHOD[p.method] ?? p.method}</Badge>
                    <span className="text-sm font-medium text-[color:var(--success)]">
                      +{formatIDR(Number(p.amount))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
