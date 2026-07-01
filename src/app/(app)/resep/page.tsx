import { Suspense } from "react";
import Link from "next/link";
import { Plus, BookOpenCheck, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import { calcHppTotal, calcHppPerUnit, calcMargin } from "@/lib/hpp";
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
  recipe_items: { quantity: number; ingredient: { last_unit_cost: number } | null }[];
};

export default async function ResepPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select(
      "id, name, yield_qty, overhead_cost, product:products(name, price_b2c, unit), recipe_items(quantity, ingredient:ingredients(last_unit_cost))",
    )
    .order("created_at", { ascending: false });

  const recipes = (data ?? []) as unknown as RecipeRow[];

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
              r.recipe_items.map((it) => ({
                quantity: Number(it.quantity),
                unitCost: Number(it.ingredient?.last_unit_cost ?? 0),
              })),
              Number(r.overhead_cost),
            );
            const hppPerUnit = calcHppPerUnit(hppTotal, Number(r.yield_qty));
            const price = Number(r.product?.price_b2c ?? 0);
            const margin = calcMargin(price, hppPerUnit);
            return (
              <Link key={r.id} href={`/resep/${r.id}`}>
                <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {r.product?.name ?? "Produk?"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      HPP {formatIDR(hppPerUnit)}/{r.product?.unit ?? "unit"}
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
