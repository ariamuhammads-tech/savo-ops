import type { createClient } from "@/lib/supabase/server";

type SB = Awaited<ReturnType<typeof createClient>>;

/**
 * Find an ingredient by (case-insensitive) name, or create it. Returns its id.
 * Used to connect brand-new bahan typed in Resep / Masak / Pembelian to the
 * Bahan Baku master list. Returns null on failure.
 */
export async function findOrCreateIngredient(
  supabase: SB,
  name: string,
  opts: { unit?: string; lastUnitCost?: number; stock?: number; notes?: string } = {},
): Promise<string | null> {
  const nm = name.trim();
  if (!nm) return null;

  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .ilike("name", nm)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("ingredients")
    .insert({
      name: nm,
      unit: opts.unit || "g",
      stock_qty: opts.stock ?? 0,
      last_unit_cost: opts.lastUnitCost ?? 0,
      avg_unit_cost: opts.lastUnitCost ?? 0,
      notes: opts.notes ?? null,
    })
    .select("id")
    .single();
  return created?.id ?? null;
}
