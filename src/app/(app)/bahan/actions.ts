"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Nama bahan wajib diisi."),
  unit: z.string().trim().min(1, "Satuan wajib dipilih."),
  stock_qty: z.coerce.number().min(0, "Stok tidak boleh negatif."),
  min_stock: z.coerce.number().min(0, "Stok minimum tidak boleh negatif."),
  last_unit_cost: z.coerce.number().min(0, "Harga tidak boleh negatif."),
  supplier_name: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function parse(formData: FormData) {
  return ingredientSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    stock_qty: formData.get("stock_qty") || 0,
    min_stock: formData.get("min_stock") || 0,
    last_unit_cost: formData.get("last_unit_cost") || 0,
    supplier_name: formData.get("supplier_name") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createIngredient(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").insert({
    ...parsed.data,
    // Bahan baru: rata-rata tertimbang mulai dari harga yang diisi.
    avg_unit_cost: parsed.data.last_unit_cost,
    supplier_name: parsed.data.supplier_name || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/bahan");
  redirect("/bahan?msg=" + encodeURIComponent("Bahan baku ditambahkan."));
}

export async function updateIngredient(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID tidak ditemukan." };

  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  // Mengubah harga secara MANUAL dianggap override sadar: rata-rata tertimbang
  // ikut di-reset ke harga baru. Mengedit field lain tidak menyentuh rata-rata
  // (yang dihitung otomatis dari pembelian).
  const { data: current } = await supabase
    .from("ingredients")
    .select("last_unit_cost")
    .eq("id", id)
    .single();
  const priceChanged =
    !current || Number(current.last_unit_cost) !== parsed.data.last_unit_cost;

  const { error } = await supabase
    .from("ingredients")
    .update({
      ...parsed.data,
      ...(priceChanged ? { avg_unit_cost: parsed.data.last_unit_cost } : {}),
      supplier_name: parsed.data.supplier_name || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/bahan");
  redirect("/bahan?msg=" + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteIngredient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/bahan?err=" + encodeURIComponent("ID tidak ditemukan."));

  const supabase = await createClient();
  const { error } = await supabase.from("ingredients").delete().eq("id", id);

  if (error) {
    redirect("/bahan?err=" + encodeURIComponent("Gagal menghapus: " + error.message));
  }

  revalidatePath("/bahan");
  redirect("/bahan?msg=" + encodeURIComponent("Bahan baku dihapus."));
}

/** Adjust stock by a delta and log a stock_movements row. */
export async function adjustIngredientStock(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("qty_change") ?? 0);
  const note = String(formData.get("notes") ?? "").trim();

  if (!id || !Number.isFinite(delta) || delta === 0) {
    redirect(`/bahan/${id}?err=` + encodeURIComponent("Jumlah penyesuaian tidak valid."));
  }

  const supabase = await createClient();
  const { data: ing, error: readErr } = await supabase
    .from("ingredients")
    .select("stock_qty")
    .eq("id", id)
    .single();

  if (readErr || !ing) {
    redirect(`/bahan/${id}?err=` + encodeURIComponent("Bahan tidak ditemukan."));
  }

  const newQty = Number(ing!.stock_qty) + delta;
  if (newQty < 0) {
    redirect(`/bahan/${id}?err=` + encodeURIComponent("Stok hasil tidak boleh negatif."));
  }

  const { error: updErr } = await supabase
    .from("ingredients")
    .update({ stock_qty: newQty })
    .eq("id", id);
  if (updErr) {
    redirect(`/bahan/${id}?err=` + encodeURIComponent("Gagal memperbarui stok."));
  }

  await supabase.from("stock_movements").insert({
    item_type: "ingredient",
    item_id: id,
    movement_type: "adjustment",
    qty_change: delta,
    balance_after: newQty,
    notes: note || null,
  });

  revalidatePath("/bahan");
  revalidatePath(`/bahan/${id}`);
  redirect("/bahan?msg=" + encodeURIComponent("Stok disesuaikan."));
}
