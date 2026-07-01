import { Suspense } from "react";
import Link from "next/link";
import { Plus, ShoppingBag, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  purchase_no: string | null;
  supplier_name: string | null;
  purchase_date: string;
  total: number;
};

export default async function PembelianPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, purchase_no, supplier_name, purchase_date, total")
    .order("created_at", { ascending: false });

  const purchases = (data ?? []) as Row[];

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Pembelian</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(purchases.length)} pembelian bahan
          </p>
        </div>
        <Button asChild>
          <Link href="/pembelian/baru">
            <Plus />
            Catat
          </Link>
        </Button>
      </div>

      {purchases.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada pembelian</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Catat pembelian bahan untuk menambah stok &amp; memperbarui harga beli
            (dipakai HPP).
          </p>
          <Button asChild className="mt-2">
            <Link href="/pembelian/baru">
              <Plus />
              Catat pembelian
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <Link key={p.id} href={`/pembelian/${p.id}`}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.purchase_no ?? "—"}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {p.supplier_name ?? "Tanpa pemasok"} · {formatDate(p.purchase_date)} ·{" "}
                    <span className="font-medium text-foreground">{formatIDR(Number(p.total))}</span>
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
