// HPP (COGS) calculation helpers for SAVO Ops.
// hpp_total    = SUM(item.quantity × ingredient.last_unit_cost) + overhead_cost
// hpp_per_unit = hpp_total / yield_qty

export type HppItem = {
  quantity: number;
  unitCost: number; // ingredient.last_unit_cost
};

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
