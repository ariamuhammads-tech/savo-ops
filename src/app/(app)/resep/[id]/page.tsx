import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, Coins, Info, Factory } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import { calcHppTotal, calcHppPerUnit, effectiveUnitCost, actualHppStats } from "@/lib/hpp";
import { canonicalUnit, convertQty, formatQty } from "@/lib/units";
import { RecipeForm } from "../recipe-form";
import { HppCalculator } from "../hpp-calculator";
import { AddRecipeItemForm } from "../add-recipe-item-form";
import { updateRecipe, deleteRecipe, deleteRecipeItem } from "../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmSubmitButton, SubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Detail = {
  id: string;
  product_id: string;
  name: string;
  yield_qty: number;
  yield_unit: string | null;
  overhead_cost: number;
  notes: string | null;
  product: {
    name: string;
    unit: string;
    category: string | null;
    price_b2c: number;
    price_b2b: number;
  } | null;
  recipe_items: {
    id: string;
    quantity: number;
    unit: string | null;
    ingredient: {
    id: string;
    name: string;
    unit: string;
    last_unit_cost: number;
    avg_unit_cost: number;
  } | null;
  }[];
};

export default async function ResepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: recipeData }, { data: ingredientList }, { data: batchData }] =
    await Promise.all([
      supabase
        .from("recipes")
        .select(
          "id, product_id, name, yield_qty, yield_unit, overhead_cost, notes, product:products(name, unit, category, price_b2c, price_b2b), recipe_items(id, quantity, unit, ingredient:ingredients(id, name, unit, last_unit_cost, avg_unit_cost))",
        )
        .eq("id", id)
        .single(),
      supabase
        .from("ingredients")
        .select("id, name, unit, last_unit_cost, avg_unit_cost")
        .order("name"),
      supabase
        .from("production_batches")
        .select("batch_count, produced_qty, hpp_per_unit")
        .eq("recipe_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  if (!recipeData) notFound();
  const recipe = recipeData as unknown as Detail;

  // Normalize every recipe quantity into the ingredient's own unit so cost
  // math is always right (last_unit_cost is per ingredient unit), even for
  // legacy rows saved in g while the ingredient is stocked in kg.
  const items = (recipe.recipe_items ?? []).map((it) => {
    const ingUnit = canonicalUnit(it.ingredient?.unit ?? it.unit ?? "");
    const qty =
      convertQty(Number(it.quantity), canonicalUnit(it.unit ?? ingUnit), ingUnit) ??
      Number(it.quantity);
    return { ...it, normQty: qty, normUnit: ingUnit };
  });
  const materials = items.reduce(
    (s, it) => s + it.normQty * effectiveUnitCost(it.ingredient),
    0,
  );
  const hppTotal = calcHppTotal(
    items.map((it) => ({
      quantity: it.normQty,
      unitCost: effectiveUnitCost(it.ingredient),
    })),
    Number(recipe.overhead_cost),
  );
  const hppPerUnit = calcHppPerUnit(hppTotal, Number(recipe.yield_qty));
  const unit = recipe.product?.unit ?? "unit";

  // ===== Effective HPP: reality-first, standard as fallback =====
  // The recipe's yield/HPP is the STANDARD (stable pricing basis, never
  // auto-mutated). Each recorded production stores its real result + actual
  // HPP; the EFFECTIVE HPP shown & used for margin follows that reality
  // automatically, falling back to the standard when nothing was produced yet.
  const stats = actualHppStats(batchData ?? []);
  const hasActual = stats.count > 0;
  const hppEffective = hasActual ? stats.avgHpp : hppPerUnit;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link
        href="/resep"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {recipe.product?.name ?? "Produk"}
        </h1>
        <p className="text-sm text-muted-foreground">Resep: {recipe.name}</p>
      </div>

      {/* ===== HPP headline ===== */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-5 text-primary" />
            HPP (Modal) &amp; Margin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-secondary/60 p-4 text-center">
            <p className="text-sm text-muted-foreground">HPP per {unit}</p>
            <p className="font-serif text-3xl font-bold text-primary">
              {formatIDR(hppEffective)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasActual
                ? `otomatis dari ${stats.count} produksi nyata terakhir`
                : "dari resep standar — belum ada produksi tercatat"}
            </p>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row label="Biaya bahan (per batch)" value={formatIDR(materials)} />
            <Row label="Overhead (per batch)" value={formatIDR(Number(recipe.overhead_cost))} />
            <Row label="Total HPP (per batch)" value={formatIDR(hppTotal)} bold />
            <Row
              label="Hasil per batch (standar)"
              value={`${formatNumber(Number(recipe.yield_qty))} ${recipe.yield_unit ?? unit}`}
            />
            {hasActual && (
              <Row label="HPP standar resep" value={formatIDR(hppPerUnit)} />
            )}
          </div>

          <HppCalculator
            hppPerUnit={hppEffective}
            priceB2C={Number(recipe.product?.price_b2c ?? 0)}
            priceB2B={Number(recipe.product?.price_b2b ?? 0)}
          />

          {recipe.product?.category === "RTH" && (
            <div className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 text-primary" />
              <span>
                Ekonomi RTH: 1 pack 250g ≈ 3–4 porsi restoran, BEP kafe ± 2
                porsi/pack.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Reality check: standard vs actual production ===== */}
      {hasActual && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="size-5 text-primary" />
              Realisasi Produksi
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.count} produksi terakhir)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Hasil nyata / batch</p>
                <p className="font-serif text-xl font-bold">
                  {formatNumber(stats.avgYield, stats.avgYield % 1 === 0 ? 0 : 1)}{" "}
                  <span className="text-sm font-normal">{recipe.yield_unit ?? unit}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  standar {formatNumber(Number(recipe.yield_qty))}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">HPP nyata / {unit}</p>
                <p className="font-serif text-xl font-bold">{formatIDR(stats.avgHpp)}</p>
                <p className="text-xs text-muted-foreground">
                  standar {formatIDR(hppPerUnit)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 text-primary" />
              <span>
                HPP utama di atas otomatis mengikuti angka nyata ini setiap kali
                produksi dicatat di menu Masak. Resep standar tidak berubah
                sendiri — ubah &quot;Hasil per batch&quot; di Detail Resep hanya
                jika standar kerjanya memang mau dikoreksi.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Recipe items ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bahan Resep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada bahan. Tambahkan di bawah untuk menghitung HPP.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it) => {
                const cost = it.normQty * effectiveUnitCost(it.ingredient);
                return (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {it.ingredient?.name ?? "Bahan?"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatQty(it.normQty, it.normUnit)} · {formatIDR(cost)}
                      </p>
                    </div>
                    <form action={deleteRecipeItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="recipe_id" value={recipe.id} />
                      <SubmitButton
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 />
                      </SubmitButton>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm font-medium">Tambah bahan</p>
            <AddRecipeItemForm
              recipeId={recipe.id}
              ingredients={(ingredientList ?? []).map((i) => ({
                id: i.id,
                name: i.name,
                unit: i.unit,
                // Cost shown/estimated in the form = the HPP cost basis.
                last_unit_cost: effectiveUnitCost(i),
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* ===== Edit meta ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Resep</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipeForm
            action={updateRecipe}
            recipe={{
              id: recipe.id,
              product_id: recipe.product_id,
              name: recipe.name,
              yield_qty: Number(recipe.yield_qty),
              yield_unit: recipe.yield_unit,
              overhead_cost: Number(recipe.overhead_cost),
              notes: recipe.notes,
            }}
            productName={recipe.product?.name}
          />
        </CardContent>
      </Card>

      {/* ===== Delete ===== */}
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Hapus resep ini</p>
            <p className="text-sm text-muted-foreground">
              Resep &amp; semua bahannya akan dihapus.
            </p>
          </div>
          <form action={deleteRecipe}>
            <input type="hidden" name="id" value={recipe.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText="Hapus resep ini? Tindakan ini tidak bisa dibatalkan."
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

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
