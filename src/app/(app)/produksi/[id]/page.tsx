import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Save, Factory } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { editProduction, deleteProduction } from "../../masak/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton, ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Detail = {
  id: string;
  batch_no: string | null;
  batch_count: number;
  produced_qty: number;
  hpp_total: number;
  hpp_per_unit: number;
  produced_at: string;
  notes: string | null;
  product: { name: string; unit: string } | null;
};

export default async function ProduksiEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("production_batches")
    .select("id, batch_no, batch_count, produced_qty, hpp_total, hpp_per_unit, produced_at, notes, product:products(name, unit)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const b = data as unknown as Detail;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link href="/produksi" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div className="flex items-center gap-2">
        <Factory className="size-5 text-primary" />
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {b.product?.name ?? "Produk"}
        </h1>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">{b.batch_no}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ubah Catatan Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={editProduction} className="space-y-4">
            <input type="hidden" name="id" value={b.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batch_count" className="text-xs">Jumlah batch</Label>
                <Input id="batch_count" name="batch_count" type="number" inputMode="decimal" min="1" step="any" defaultValue={Number(b.batch_count)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="produced_qty" className="text-xs">Hasil jadi ({b.product?.unit ?? "unit"})</Label>
                <Input id="produced_qty" name="produced_qty" type="number" inputMode="decimal" min="0" step="any" defaultValue={Number(b.produced_qty)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="produced_at" className="text-xs">Tanggal</Label>
              <Input id="produced_at" name="produced_at" type="date" defaultValue={b.produced_at} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Catatan</Label>
              <Textarea id="notes" name="notes" defaultValue={b.notes ?? ""} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total HPP batch</span>
              <span className="font-medium">{formatIDR(Number(b.hpp_total))}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mengubah catatan tidak otomatis menyesuaikan stok (stok sudah tercatat saat produksi). HPP/unit dihitung ulang dari total ÷ hasil.
            </p>
            <SubmitButton icon={Save} pendingText="Menyimpan…" className="w-full sm:w-auto">
              Simpan perubahan
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-medium">Hapus catatan produksi</p>
            <p className="text-xs text-muted-foreground">
              Tercatat pada {formatDate(b.produced_at)}.
            </p>
          </div>
          <form action={deleteProduction}>
            <input type="hidden" name="id" value={b.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus catatan produksi ${b.batch_no}? Stok tidak dikembalikan.`}
            >
              <Trash2 />
              Hapus
            </ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
