import { Suspense } from "react";
import Link from "next/link";
import { Plus, BookOpenCheck, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import {
  calcHppTotal,
  calcHppPerUnit,
  calcMargin,
  effectiveUnitCost,
  actualHppStats,
  type BatchLike,
} from "@/lib/hpp";
import { canonicalUnit, convertQty } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type RecipeRow = {
  id: string;
  name: string;
  yield_qty: number;
  overhead_cost: number;
  product: { name: string; price_b2c: number; unit: string } | null;
  recipe_items: {
    quantity: number;
    unit: string | null;
    ingredient: { unit: string; last_unit_cost: number; avg_unit_cost: number } | null;
  }[];
};

export default async function ResepPage() {
  const supabase = await createClient();
  const [{ data }, { data: batchData }] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, name, yield_qty, overhead_cost, product:products(name, price_b2c, unit), recipe_items(quantity, unit, ingredient:ingredients(unit, last_unit_cost, avg_unit_cost))",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("production_batches")
      .select("recipe_id, batch_count, produced_qty, hpp_per_unit")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const recipes = (data ?? []) as unknown as RecipeRow[];

  // Last ≤10 real batches per recipe → effective (actual) HPP per recipe.
  const batchesByRecipe = new Map<string, BatchLike[]>();
  for (const b of batchData ?? []) {
    if (!b.recipe_id) continue;
    const list = batchesByRecipe.get(b.recipe_id) ?? [];
    if (list.length < 10) {
      list.push(b);
      batchesByRecipe.set(b.recipe_id, list);
    }
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Resep &amp; HPP
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(recipes.length)} resep
          </p>
        </div>
        <Button asChild>
          <Link href="/resep/baru">
            <Plus />
            Buat resep
          </Link>
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <BookOpenCheck className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada resep</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Buat resep standar per produk untuk menghitung HPP (modal) &amp; margin
            otomatis.
          </p>
          <Button asChild className="mt-2">
            <Link href="/resep/baru">
              <Plus />
              Buat resep
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => {
            const hppTotal = calcHppTotal(
              r.recipe_items.map((it) => {
                // Same normalization as the detail page: cost is per the
                // ingredient's unit, so convert legacy g↔kg / ml↔l rows first.
                const ingUnit = canonicalUnit(it.ingredient?.unit ?? it.unit ?? "");
                const qty =
                  convertQty(
                    Number(it.quantity),
                    canonicalUnit(it.unit ?? ingUnit),
                    ingUnit,
                  ) ?? Number(it.quantity);
                return { quantity: qty, unitCost: effectiveUnitCost(it.ingredient) };
              }),
              Number(r.overhead_cost),
            );
            const hppPerUnit = calcHppPerUnit(hppTotal, Number(r.yield_qty));
            // Effective HPP: actual production average when available,
            // recipe standard otherwise — same rule as the detail page.
            const stats = actualHppStats(batchesByRecipe.get(r.id) ?? []);
            const hppEffective = stats.count > 0 ? stats.avgHpp : hppPerUnit;
            const price = Number(r.product?.price_b2c ?? 0);
            const margin = calcMargin(price, hppEffective);
            return (
              <Link key={r.id} href={`/resep/${r.id}`}>
                <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {r.product?.name ?? "Produk?"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      HPP {formatIDR(hppEffective)}/{r.product?.unit ?? "unit"}
                      <span className="text-xs">
                        {" "}
                        ({stats.count > 0 ? "nyata" : "standar"})
                      </span>
                      {price > 0 && (
                        <>
                          {" · "}
                          <span
                            className={
                              margin < 0 ? "text-destructive" : "text-[color:var(--success)]"
                            }
                          >
                            margin {(margin * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {price > 0 && margin < 0 && (
                    <Badge variant="destructive">Rugi</Badge>
                  )}
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
