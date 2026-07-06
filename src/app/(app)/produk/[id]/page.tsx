import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { calcHppTotal, calcHppPerUnit, effectiveUnitCost } from "@/lib/hpp";
import { canonicalUnit, convertQty } from "@/lib/units";
import { PriceSlider } from "@/components/price-slider";
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
  const [{ data: product }, { data: recipeData }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    // HPP estimasi dari resep produk ini (untuk slider harga).
    supabase
      .from("recipes")
      .select(
        "yield_qty, overhead_cost, recipe_items(quantity, unit, ingredient:ingredients(unit, last_unit_cost, avg_unit_cost))",
      )
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!product) notFound();

  // Perhitungan yang sama dengan halaman Resep (konversi satuan + modal rata-rata).
  let hppEstimasi = 0;
  if (recipeData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = recipeData as any;
    const hppTotal = calcHppTotal(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rec.recipe_items ?? []).map((it: any) => {
        const ingUnit = canonicalUnit(it.ingredient?.unit ?? it.unit ?? "");
        const qty =
          convertQty(Number(it.quantity), canonicalUnit(it.unit ?? ingUnit), ingUnit) ??
          Number(it.quantity);
        return { quantity: qty, unitCost: effectiveUnitCost(it.ingredient) };
      }),
      Number(rec.overhead_cost),
    );
    hppEstimasi = calcHppPerUnit(hppTotal, Number(rec.yield_qty));
  }

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

      {/* Harga & margin (review 2026-07-06 #2: slider juga di Produk) */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base">Harga &amp; Margin</CardTitle>
        </CardHeader>
        <CardContent>
          {recipeData ? (
            <PriceSlider
              productId={product.id}
              hpp={hppEstimasi}
              priceB2C={Number(product.price_b2c)}
              priceB2B={Number(product.price_b2b)}
            />
          ) : (
            <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Produk ini belum punya resep, jadi HPP belum bisa dihitung. Buat
              resepnya di menu{" "}
              <Link href="/resep" className="font-medium text-primary underline">
                Resep &amp; HPP
              </Link>{" "}
              untuk memakai saran harga.
            </p>
          )}
        </CardContent>
      </Card>

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
