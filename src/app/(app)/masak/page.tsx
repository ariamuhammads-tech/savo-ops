import Link from "next/link";
import { ChefHat } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CookCalculator, type CookRecipe } from "./cook-calculator";

export const dynamic = "force-dynamic";

export default async function MasakPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select(
      "id, name, yield_qty, yield_unit, overhead_cost, product:products(name, unit), recipe_items(quantity, unit, ingredient:ingredients(name, unit, stock_qty, last_unit_cost))",
    )
    .order("created_at", { ascending: false });

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
    </div>
  );
}
