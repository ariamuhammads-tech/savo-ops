import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { deletePurchase } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Detail = {
  id: string;
  purchase_no: string | null;
  supplier_name: string | null;
  purchase_date: string;
  total: number;
  notes: string | null;
  purchase_items: { id: string; name: string | null; qty: number; unit_cost: number; subtotal: number }[];
};

export default async function PembelianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, purchase_no, supplier_name, purchase_date, total, notes, purchase_items(id, name, qty, unit_cost, subtotal)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const p = data as unknown as Detail;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link href="/pembelian" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">{p.purchase_no}</h1>
        <p className="text-sm text-muted-foreground">
          {p.supplier_name ?? "Tanpa pemasok"} · {formatDate(p.purchase_date)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bahan Dibeli</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y divide-border">
            {p.purchase_items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(it.qty)} × {formatIDR(Number(it.unit_cost))}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatIDR(Number(it.subtotal))}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="font-serif text-lg font-bold text-primary">{formatIDR(Number(p.total))}</span>
          </div>
        </CardContent>
      </Card>

      {p.notes && (
        <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
          Catatan: {p.notes}
        </p>
      )}

      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-medium">Hapus pembelian</p>
            <p className="text-xs text-muted-foreground">Stok bahan akan dikembalikan.</p>
          </div>
          <form action={deletePurchase}>
            <input type="hidden" name="id" value={p.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus pembelian ${p.purchase_no}? Stok yang ditambahkan akan dikurangi kembali.`}
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
