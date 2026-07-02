import { Suspense } from "react";
import Link from "next/link";
import { Factory, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  batch_no: string | null;
  produced_qty: number;
  batch_count: number;
  hpp_per_unit: number;
  produced_at: string;
  product: { name: string; unit: string } | null;
};

export default async function ProduksiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("production_batches")
    .select("id, batch_no, produced_qty, batch_count, hpp_per_unit, produced_at, product:products(name, unit)")
    .order("created_at", { ascending: false });

  const batches = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Produksi</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(batches.length)} catatan produksi · ketuk untuk ubah
        </p>
      </div>

      {batches.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Factory className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada produksi</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Catat produksi dari menu{" "}
            <Link href="/masak" className="font-medium text-primary underline">
              Masak
            </Link>{" "}
            (tombol “Catat Produksi”).
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {batches.map((b) => (
            <Link key={b.id} href={`/produksi/${b.id}`}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {b.product?.name ?? "Produk"}{" "}
                    <span className="text-xs text-muted-foreground">{b.batch_no}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {formatDate(b.produced_at)} · {formatNumber(Number(b.produced_qty))}{" "}
                    {b.product?.unit ?? "unit"} · HPP {formatIDR(Number(b.hpp_per_unit))}/unit
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
