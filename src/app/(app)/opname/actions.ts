"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { effectiveUnitCost } from "@/lib/hpp";
import { formatQty } from "@/lib/units";

export const OPNAME_REASONS = [
  "Rusak / kedaluwarsa",
  "Susut / tumpah",
  "Salah catat",
  "Hilang",
  "Lainnya",
] as const;

export type OpnameRow = {
  id: string;
  /** Stok aktual hasil hitung fisik, dalam satuan bahan. */
  actual: number;
  reason: string;
};

export type OpnameResult =
  | { ok: true; adjusted: number; lossValue: number }
  | { ok: false; error: string };

/**
 * Stock opname: set each counted ingredient's stock to the physical count,
 * log the difference (with its reason) to stock_movements, and book the value
 * of any losses as one Keuangan expense ("Selisih Opname") so shrinkage hits
 * the profit view — not the per-pack HPP.
 */
export async function applyOpname(rows: OpnameRow[]): Promise<OpnameResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Tidak ada bahan yang dihitung." };
  }
  if (rows.length > 300) return { ok: false, error: "Terlalu banyak baris." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Muat ulang halaman." };

  let adjusted = 0;
  let lossValue = 0;
  const lossLines: string[] = [];

  for (const row of rows) {
    const actual = Number(row.actual);
    if (!Number.isFinite(actual) || actual < 0) continue;

    const { data: ing } = await supabase
      .from("ingredients")
      .select("id, name, unit, stock_qty, avg_unit_cost, last_unit_cost")
      .eq("id", row.id)
      .single();
    if (!ing) continue;

    const current = Number(ing.stock_qty);
    const diff = actual - current;
    if (diff === 0) continue;

    const reason = String(row.reason || "").trim() || "Tanpa alasan";

    const { error } = await supabase
      .from("ingredients")
      .update({ stock_qty: actual })
      .eq("id", ing.id);
    if (error) continue;

    await supabase.from("stock_movements").insert({
      item_type: "ingredient",
      item_id: ing.id,
      movement_type: "adjustment",
      qty_change: diff,
      balance_after: actual,
      ref_type: "opname",
      notes: `Opname: ${reason}`,
    });

    adjusted += 1;
    if (diff < 0) {
      const value = Math.round(Math.abs(diff) * effectiveUnitCost(ing));
      if (value > 0) {
        lossValue += value;
        lossLines.push(`${ing.name} -${formatQty(Math.abs(diff), ing.unit)} (${reason})`);
      }
    }
  }

  if (adjusted === 0) {
    return { ok: false, error: "Tidak ada selisih — stok aktual sama dengan sistem." };
  }

  // Book total shrinkage as one operational expense (visible in Keuangan).
  if (lossValue > 0) {
    await supabase.from("expenses").insert({
      category: "Selisih Opname",
      description: lossLines.join("; ").slice(0, 500),
      amount: lossValue,
      notes: "Dibuat otomatis dari Stock Opname",
    });
  }

  revalidatePath("/opname");
  revalidatePath("/bahan");
  revalidatePath("/keuangan");
  revalidatePath("/");
  return { ok: true, adjusted, lossValue };
}
