import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { ProductForm } from "../product-form";
import { updateProduct, deleteProduct, adjustProductStock } from "../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton, ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

export default async function ProdukEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link
        href="/produk"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-serif text-2xl font-bold tracking-tight">
        {product.name}
      </h1>

      {/* Stock adjustment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="size-5 text-primary" />
            Sesuaikan Stok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Stok sekarang:{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(Number(product.stock_qty))} {product.unit}
            </span>
          </p>
          <form action={adjustProductStock} className="space-y-3">
            <input type="hidden" name="id" value={product.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="qty_change">Perubahan (+/−)</Label>
                <Input
                  id="qty_change"
                  name="qty_change"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="mis. 10 atau -3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adj_notes">Alasan</Label>
                <Input id="adj_notes" name="notes" placeholder="mis. produksi" />
              </div>
            </div>
            <SubmitButton variant="secondary" pendingText="Menyimpan…">
              Sesuaikan
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      {/* Edit details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm action={updateProduct} product={product} />
        </CardContent>
      </Card>

      {/* Delete */}
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Hapus produk ini</p>
            <p className="text-sm text-muted-foreground">
              Data produk akan dihapus permanen.
            </p>
          </div>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus "${product.name}"? Tindakan ini tidak bisa dibatalkan.`}
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
