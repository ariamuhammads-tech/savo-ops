"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateIngredient } from "@/lib/ingredients";

/** Quick-add a bahan baku from the Masak tab; connects to Bahan Baku. */
export async function quickAddIngredient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "g").trim();
  const stock = Number(formData.get("stock") ?? 0) || 0;
  const cost = Number(formData.get("last_unit_cost") ?? 0) || 0;
  if (!name) redirect("/masak?err=" + encodeURIComponent("Nama bahan wajib diisi."));

  const supabase = await createClient();
  await findOrCreateIngredient(supabase, name, { unit, stock, lastUnitCost: cost });
  revalidatePath("/masak");
  revalidatePath("/bahan");
  redirect("/masak?msg=" + encodeURIComponent("Bahan baku ditambahkan."));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Record a production run: consume ingredients, add product stock, compute actual HPP. */
export async function recordProduction(formData: FormData) {
  const recipeId = String(formData.get("recipe_id") ?? "");
  const batchCount = Number(formData.get("batch_count") ?? 0);
  const producedQty = Number(formData.get("produced_qty") ?? 0);

  if (!recipeId || !(batchCount > 0)) {
    redirect("/masak?err=" + encodeURIComponent("Pilih resep dan jumlah batch."));
  }

  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      "product_id, overhead_cost, product:products(name), recipe_items(quantity, ingredient_id, ingredient:ingredients(name, stock_qty, last_unit_cost))",
    )
    .eq("id", recipeId)
    .single();

  if (!recipe) redirect("/masak?err=" + encodeURIComponent("Resep tidak ditemukan."));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = recipe as any;

  let materialCost = 0;
  // Consume ingredients
  for (const it of rec.recipe_items ?? []) {
    if (!it.ingredient_id) continue;
    const need = Number(it.quantity) * batchCount;
    const unitCost = Number(it.ingredient?.last_unit_cost ?? 0);
    materialCost += need * unitCost;
    const current = Number(it.ingredient?.stock_qty ?? 0);
    const newQty = current - need;
    await supabase.from("ingredients").update({ stock_qty: newQty }).eq("id", it.ingredient_id);
    await supabase.from("stock_movements").insert({
      item_type: "ingredient",
      item_id: it.ingredient_id,
      movement_type: "production_out",
      qty_change: -need,
      balance_after: newQty,
      ref_type: "production",
    });
  }

  const hppTotal = round2(materialCost + Number(rec.overhead_cost) * batchCount);
  const produced = producedQty > 0 ? producedQty : 0;
  const hppPerUnit = produced > 0 ? round2(hppTotal / produced) : 0;

  const year = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", year: "numeric" });
  const { data: seq } = await supabase.rpc("next_seq", { p_name: `production-${year}` });
  const batchNo = `PRD-${year}-${String(seq ?? 0).padStart(4, "0")}`;

  const { data: batch } = await supabase
    .from("production_batches")
    .insert({
      batch_no: batchNo,
      product_id: rec.product_id,
      recipe_id: recipeId,
      batch_count: batchCount,
      produced_qty: produced,
      hpp_total: hppTotal,
      hpp_per_unit: hppPerUnit,
    })
    .select("id")
    .single();

  // Add finished product stock
  if (rec.product_id && produced > 0) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", rec.product_id)
      .single();
    if (prod) {
      const newQty = Number(prod.stock_qty) + produced;
      await supabase.from("products").update({ stock_qty: newQty }).eq("id", rec.product_id);
      await supabase.from("stock_movements").insert({
        item_type: "product",
        item_id: rec.product_id,
        movement_type: "production_in",
        qty_change: produced,
        balance_after: newQty,
        ref_type: "production",
        ref_id: batch?.id ?? null,
      });
    }
  }

  revalidatePath("/masak");
  revalidatePath("/bahan");
  revalidatePath("/produk");
  redirect("/masak?msg=" + encodeURIComponent(`Produksi ${batchNo} dicatat. Stok diperbarui.`));
}

/** Edit a production batch record (does not re-run stock effects). */
export async function editProduction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const batchCount = Number(formData.get("batch_count") ?? 0);
  const producedQty = Number(formData.get("produced_qty") ?? 0);
  const producedAt = String(formData.get("produced_at") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) redirect("/produksi?err=" + encodeURIComponent("ID tidak ditemukan."));

  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("production_batches")
    .select("hpp_total")
    .eq("id", id)
    .single();
  const hppTotal = Number(batch?.hpp_total ?? 0);
  const hppPerUnit = producedQty > 0 ? round2(hppTotal / producedQty) : 0;

  const { error } = await supabase
    .from("production_batches")
    .update({
      batch_count: batchCount > 0 ? batchCount : 1,
      produced_qty: producedQty,
      produced_at: producedAt || undefined,
      hpp_per_unit: hppPerUnit,
      notes: notes || null,
    })
    .eq("id", id);
  if (error) redirect(`/produksi/${id}?err=` + encodeURIComponent("Gagal menyimpan."));

  revalidatePath("/produksi");
  revalidatePath("/masak");
  redirect(`/produksi/${id}?msg=` + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteProduction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // Note: does not reverse stock (production consumes/creates real goods).
  await supabase.from("production_batches").delete().eq("id", id);
  revalidatePath("/masak");
  revalidatePath("/produksi");
  redirect("/produksi?msg=" + encodeURIComponent("Catatan produksi dihapus."));
}
