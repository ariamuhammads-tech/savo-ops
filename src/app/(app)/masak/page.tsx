import { Suspense } from "react";
import Link from "next/link";
import { ChefHat, Factory, Plus, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";
import { CookCalculator, type CookRecipe } from "./cook-calculator";
import { quickAddIngredient } from "./actions";

export const dynamic = "force-dynamic";

const UNITS = ["g", "kg", "ml", "l", "pcs"];

type BatchRow = {
  id: string;
  batch_no: string | null;
  produced_qty: number;
  hpp_per_unit: number;
  produced_at: string;
  product: { name: string } | null;
};

export default async function MasakPage() {
  const supabase = await createClient();
  const [{ data }, { data: batchData }] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, yield_qty, yield_unit, overhead_cost, product:products(name, unit), recipe_items(quantity, unit, ingredient:ingredients(name, unit, stock_qty, last_unit_cost))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("production_batches")
      .select("id, batch_no, produced_qty, hpp_per_unit, produced_at, product:products(name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const batches = (batchData ?? []) as unknown as BatchRow[];

  const recipes: CookRecipe[] = (data ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = r as any;
    return {
      id: rec.id,
      productName: rec.product?.name ?? "Produk",
      recipeName: rec.name,
      yieldQty: Number(rec.yield_qty),
      yieldUnit: rec.yield_unit ?? rec.product?.unit ?? "pack",
      overheadCost: Number(rec.overhead_cost),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (rec.recipe_items ?? []).map((it: any) => ({
        name: it.ingredient?.name ?? "Bahan",
        unit: it.unit ?? it.ingredient?.unit ?? "",
        perBatch: Number(it.quantity),
        stock: Number(it.ingredient?.stock_qty ?? 0),
        unitCost: Number(it.ingredient?.last_unit_cost ?? 0),
      })),
    };
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Masak</h1>
        <p className="text-sm text-muted-foreground">
          Hitung kebutuhan bahan untuk sejumlah batch produksi.
        </p>
      </div>

      {recipes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ChefHat className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada resep</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Buat resep dulu di menu{" "}
            <Link href="/resep" className="font-medium text-primary underline">
              Resep &amp; HPP
            </Link>{" "}
            agar bisa menghitung kebutuhan bahan.
          </p>
        </Card>
      ) : (
        <CookCalculator recipes={recipes} />
      )}

      {/* Quick add ingredient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-5 text-primary" />
            Tambah Bahan Baku
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={quickAddIngredient} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Nama bahan</Label>
                <Input name="name" placeholder="mis. Tepung terigu" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Satuan</Label>
                <Select name="unit" defaultValue="g">
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Stok awal</Label>
                <Input name="stock" type="number" inputMode="decimal" min="0" step="any" defaultValue={0} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga beli / satuan</Label>
                <Input name="last_unit_cost" type="number" inputMode="numeric" min="0" step="any" defaultValue={0} />
              </div>
            </div>
            <SubmitButton variant="secondary" icon={Plus} className="w-full">
              Simpan bahan
            </SubmitButton>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Otomatis muncul di menu Bahan Baku dan bisa dipakai di resep.
          </p>
        </CardContent>
      </Card>

      {batches.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="size-5 text-primary" />
              Riwayat Produksi
            </CardTitle>
            <Link href="/produksi" className="text-sm font-medium text-primary hover:underline">
              Kelola semua
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {batches.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/produksi/${b.id}`}
                    className="flex items-center justify-between gap-2 py-2 text-sm hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {b.product?.name ?? "Produk"}{" "}
                        <span className="text-xs text-muted-foreground">{b.batch_no}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.produced_at)} · {formatNumber(Number(b.produced_qty))} jadi · HPP {formatIDR(Number(b.hpp_per_unit))}/unit
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
