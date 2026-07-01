import Link from "next/link";
import { Wallet, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { METHOD_LABEL } from "../pesanan/labels";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  amount: number;
  method: string;
  paid_at: string;
  reference: string | null;
  order: { id: string; order_no: string | null; customer: { name: string } | null } | null;
};

export default async function PembayaranPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, method, paid_at, reference, order:orders(id, order_no, customer:customers(name))")
    .order("paid_at", { ascending: false })
    .limit(200);

  const payments = (data ?? []) as unknown as Row[];
  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(payments.length)} transaksi · total {formatIDR(total)}
        </p>
      </div>

      {payments.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Wallet className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada pembayaran</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Pembayaran dicatat dari halaman detail pesanan.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Link key={p.id} href={p.order ? `/pesanan/${p.order.id}` : "/pembayaran"}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{formatIDR(Number(p.amount))}</p>
                    <Badge variant="outline">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {p.order?.order_no ?? "—"} · {p.order?.customer?.name ?? "Umum"} ·{" "}
                    {formatDate(p.paid_at)}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
