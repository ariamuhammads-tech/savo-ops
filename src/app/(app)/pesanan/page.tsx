import { Suspense } from "react";
import Link from "next/link";
import { Plus, ClipboardList, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VARIANT,
  type OrderStatus,
} from "./labels";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  order_no: string | null;
  order_date: string;
  status: OrderStatus;
  total: number;
  payment_status: string;
  customer: { name: string } | null;
};

export default async function PesananPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_no, order_date, status, total, payment_status, customer:customers(name)")
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Pesanan</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(orders.length)} pesanan
          </p>
        </div>
        <Button asChild>
          <Link href="/pesanan/baru">
            <Plus />
            Buat
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ClipboardList className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada pesanan</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Buat pesanan pertama — pilih pelanggan dan produk.
          </p>
          <Button asChild className="mt-2">
            <Link href="/pesanan/baru">
              <Plus />
              Buat pesanan
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/pesanan/${o.id}`}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{o.order_no ?? "—"}</p>
                    <Badge variant={STATUS_VARIANT[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
                    <Badge variant={PAYMENT_STATUS_VARIANT[o.payment_status]}>
                      {PAYMENT_STATUS_LABEL[o.payment_status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {o.customer?.name ?? "Umum"} · {formatDate(o.order_date)} ·{" "}
                    <span className="font-medium text-foreground">
                      {formatIDR(Number(o.total))}
                    </span>
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
