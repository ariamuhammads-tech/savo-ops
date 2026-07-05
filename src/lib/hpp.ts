// HPP (COGS) calculation helpers for SAVO Ops.
// hpp_total    = SUM(item.quantity × ingredient.last_unit_cost) + overhead_cost
// hpp_per_unit = hpp_total / yield_qty

export type HppItem = {
  quantity: number;
  unitCost: number; // effective cost per ingredient unit (see effectiveUnitCost)
};

/**
 * Cost basis for HPP: the weighted-average cost of stock on hand
 * (recomputed on every purchase), falling back to the last purchase
 * price for ingredients that predate the average column.
 */
export function effectiveUnitCost(
  ing:
    | { avg_unit_cost?: number | null; last_unit_cost?: number | null }
    | null
    | undefined,
): number {
  const avg = Number(ing?.avg_unit_cost ?? 0);
  if (avg > 0) return avg;
  return Number(ing?.last_unit_cost ?? 0);
}

export function calcHppTotal(items: HppItem[], overheadCost: number): number {
  const materials = items.reduce(
    (sum, it) => sum + Number(it.quantity) * Number(it.unitCost),
    0,
  );
  return materials + Number(overheadCost || 0);
}

export function calcHppPerUnit(hppTotal: number, yieldQty: number): number {
  const y = Number(yieldQty);
  return y > 0 ? hppTotal / y : 0;
}

export type BatchLike = {
  batch_count: number | string;
  produced_qty: number | string;
  hpp_per_unit: number | string;
};

/**
 * Aggregate ACTUAL production numbers for a recipe (from production_batches):
 * weighted-average real yield per batch and real HPP per unit. This is the
 * "reality" side of costing — the recipe stays the standard.
 */
export function actualHppStats(batches: BatchLike[]) {
  const valid = batches.filter(
    (b) => Number(b.batch_count) > 0 && Number(b.produced_qty) > 0,
  );
  const totalBatches = valid.reduce((s, b) => s + Number(b.batch_count), 0);
  const totalProduced = valid.reduce((s, b) => s + Number(b.produced_qty), 0);
  const avgYield = totalBatches > 0 ? totalProduced / totalBatches : 0;
  const avgHpp =
    totalProduced > 0
      ? valid.reduce((s, b) => s + Number(b.hpp_per_unit) * Number(b.produced_qty), 0) /
        totalProduced
      : 0;
  return { count: valid.length, avgYield, avgHpp };
}

/** Margin as a fraction 0..1: (price - hpp) / price. */
export function calcMargin(price: number, hppPerUnit: number): number {
  const p = Number(price);
  if (p <= 0) return 0;
  return (p - hppPerUnit) / p;
}

/** Suggested selling price for a target margin percent (0..99). */
export function suggestedPrice(hppPerUnit: number, targetMarginPercent: number): number {
  const m = Number(targetMarginPercent) / 100;
  if (m >= 1) return Infinity;
  if (m <= 0) return hppPerUnit;
  return hppPerUnit / (1 - m);
}
