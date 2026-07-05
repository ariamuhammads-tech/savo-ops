/**
 * Unit conversion + smart quantity display for kitchen units.
 *
 * Ingredients are stocked in their own unit (e.g. "kg"), while real usage is
 * often a fraction of it (0.2 kg = 200 g). Storing stays in the ingredient's
 * unit; DISPLAY auto-scales to the most readable unit so "0,2 kg" never shows
 * up as a rounded "0 kg".
 */

type Family = { base: string; big: string; factor: number };

// mass: base g, big kg ×1000 — volume: base ml, big l ×1000
const FAMILIES: Family[] = [
  { base: "g", big: "kg", factor: 1000 },
  { base: "ml", big: "l", factor: 1000 },
];

// Common spellings people type → canonical unit.
const ALIASES: Record<string, string> = {
  g: "g",
  gr: "g",
  gram: "g",
  kg: "kg",
  kilo: "kg",
  kilogram: "kg",
  ml: "ml",
  mililiter: "ml",
  milliliter: "ml",
  l: "l",
  lt: "l",
  ltr: "l",
  liter: "l",
};

/** Canonical unit string ("Kg " → "kg"); unknown units pass through trimmed. */
export function canonicalUnit(unit: string | null | undefined): string {
  const u = String(unit ?? "").trim().toLowerCase();
  return ALIASES[u] ?? u;
}

function familyOf(unit: string): Family | null {
  return FAMILIES.find((f) => f.base === unit || f.big === unit) ?? null;
}

/** Quantity in the family's base unit (g / ml), or null for non-family units. */
function toBase(qty: number, unit: string): { qty: number; family: Family } | null {
  const fam = familyOf(unit);
  if (!fam) return null;
  return { qty: unit === fam.big ? qty * fam.factor : qty, family: fam };
}

/**
 * Convert qty between two units. Same unit → unchanged; same family (g↔kg,
 * ml↔l) → converted; incompatible → null (caller decides what to do).
 */
export function convertQty(qty: number, from: string, to: string): number | null {
  const f = canonicalUnit(from);
  const t = canonicalUnit(to);
  if (f === t) return qty;
  const fb = toBase(qty, f);
  const fam = familyOf(t);
  if (!fb || !fam || fb.family.base !== fam.base) return null;
  return t === fam.big ? fb.qty / fam.factor : fb.qty;
}

// id-ID number with sensible decimals, no forced rounding to integer.
const nf = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Human-friendly quantity: picks the most readable unit within the family.
 *   formatQty(0.2, "kg")  -> "200 g"
 *   formatQty(1500, "g")  -> "1,5 kg"
 *   formatQty(250, "ml")  -> "250 ml"
 *   formatQty(3, "pack")  -> "3 pack"
 */
export function formatQty(qty: number | null | undefined, unit: string | null | undefined): string {
  const n = Number(qty ?? 0);
  const u = canonicalUnit(unit);
  const based = toBase(n, u);
  if (!based) return `${nf.format(n)}${u ? ` ${u}` : ""}`;
  const abs = Math.abs(based.qty);
  if (abs >= based.family.factor || abs === 0) {
    return `${nf.format(based.qty / based.family.factor)} ${based.family.big}`;
  }
  return `${nf.format(based.qty)} ${based.family.base}`;
}
