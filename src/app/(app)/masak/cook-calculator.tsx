"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Coins, Factory } from "lucide-react";

import { formatIDR, formatNumber } from "@/lib/format";
import { formatQty } from "@/lib/units";
import { recordProduction } from "./actions";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type CookRecipe = {
  id: string;
  productName: string;
  recipeName: string;
  yieldQty: number;
  yieldUnit: string;
  overheadCost: number;
  items: { name: string; unit: string; perBatch: number; stock: number; unitCost: number }[];
};

export function CookCalculator({ recipes }: { recipes: CookRecipe[] }) {
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? "");
  const [batches, setBatches] = useState(1);
  const [target, setTarget] = useState("");
  const [produced, setProduced] = useState("");

  const recipe = useMemo(
    () => recipes.find((r) => r.id === recipeId) ?? recipes[0],
    [recipes, recipeId],
  );

  const setBatchesSafe = (n: number) => setBatches(Math.max(1, Math.round(n || 1)));

  function applyTarget() {
    const t = Number(target);
    if (recipe && t > 0 && recipe.yieldQty > 0) {
      setBatchesSafe(Math.ceil(t / recipe.yieldQty));
    }
  }

  const rows = (recipe?.items ?? []).map((it) => {
    const total = it.perBatch * batches;
    const enough = it.stock >= total;
    return { ...it, total, enough, shortfall: enough ? 0 : total - it.stock };
  });

  const materialCost =
    (recipe?.items ?? []).reduce((s, it) => s + it.perBatch * it.unitCost, 0) * batches;
  const overheadTotal = (recipe?.overheadCost ?? 0) * batches;
  const totalCost = materialCost + overheadTotal;
  const totalYield = (recipe?.yieldQty ?? 0) * batches;
  const anyShort = rows.some((r) => !r.enough);
  const producedValue = produced === "" ? totalYield : Number(produced) || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="recipe">Resep / Produk</Label>
            <Select id="recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.productName} — {r.recipeName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jumlah batch</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBatchesSafe(batches - 1)}
                className="flex size-10 items-center justify-center rounded-md border border-input hover:bg-secondary"
                aria-label="Kurangi batch"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                value={batches}
                onChange={(e) => setBatchesSafe(Number(e.target.value))}
                className="w-20 text-center"
              />
              <button
                type="button"
                onClick={() => setBatchesSafe(batches + 1)}
                className="flex size-10 items-center justify-center rounded-md border border-input hover:bg-secondary"
                aria-label="Tambah batch"
              >
                <Plus className="size-4" />
              </button>
              <span className="ml-1 text-sm text-muted-foreground">
                = {formatNumber(totalYield)} {recipe?.yieldUnit}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="target" className="text-xs">
                Atau target hasil ({recipe?.yieldUnit})
              </Label>
              <Input
                id="target"
                type="number"
                inputMode="numeric"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="mis. 30"
              />
            </div>
            <button
              type="button"
              onClick={applyTarget}
              className="h-10 rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/70"
            >
              Hitung batch
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Ingredient needs */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium">Kebutuhan bahan</p>
            {rows.length > 0 &&
              (anyShort ? (
                <Badge variant="destructive">Stok kurang</Badge>
              ) : (
                <Badge variant="success">Stok cukup</Badge>
              ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Resep ini belum punya bahan. Tambahkan di menu Resep &amp; HPP.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">Bahan</th>
                    <th className="py-1.5 px-2 text-right font-medium">Total</th>
                    <th className="py-1.5 px-2 text-right font-medium">Stok</th>
                    <th className="py-1.5 pl-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-b border-border/60">
                      <td className="py-2 pr-2">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatQty(r.perBatch, r.unit)}/batch
                        </p>
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatQty(r.total, r.unit)}
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground">
                        {formatQty(r.stock, r.unit)}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        {r.enough ? (
                          <span className="text-[color:var(--success)]">cukup</span>
                        ) : (
                          <span className="text-destructive">
                            kurang {formatQty(r.shortfall, r.unit)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost */}
      <Card>
        <CardContent className="space-y-1.5 pt-6 text-sm">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Coins className="size-4 text-primary" />
            Estimasi biaya produksi
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Biaya bahan</span>
            <span>{formatIDR(materialCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Overhead ({batches} batch)</span>
            <span>{formatIDR(overheadTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="font-medium">Total</span>
            <span className="font-serif text-base font-bold text-primary">
              {formatIDR(totalCost)}
            </span>
          </div>
          {totalYield > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              ≈ {formatIDR(totalCost / totalYield)} per {recipe?.yieldUnit}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Record production */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 font-medium">
            <Factory className="size-4 text-primary" />
            Catat Produksi
          </div>
          <p className="text-xs text-muted-foreground">
            Menyimpan produksi akan <span className="font-medium">mengurangi stok bahan</span> dan{" "}
            <span className="font-medium">menambah stok produk jadi</span> sesuai hasil.
          </p>
          <form action={recordProduction} className="space-y-3">
            <input type="hidden" name="recipe_id" value={recipeId} />
            <input type="hidden" name="batch_count" value={batches} />
            <input type="hidden" name="produced_qty" value={producedValue} />
            <div className="space-y-1">
              <Label htmlFor="produced" className="text-xs">
                Hasil jadi ({recipe?.yieldUnit})
              </Label>
              <Input
                id="produced"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={produced}
                onChange={(e) => setProduced(e.target.value)}
                placeholder={String(totalYield)}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk pakai perkiraan {formatNumber(totalYield)} {recipe?.yieldUnit}.
              </p>
            </div>
            <ConfirmSubmitButton
              className="w-full"
              confirmText={
                anyShort
                  ? "Stok bahan tidak cukup — lanjutkan catat produksi? Stok bahan bisa jadi minus."
                  : "Catat produksi ini? Stok bahan berkurang & stok produk bertambah."
              }
            >
              <Factory />
              Catat Produksi
            </ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
