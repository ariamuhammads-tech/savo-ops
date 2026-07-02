"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateIngredient } from "@/lib/ingredients";

export type FormState = { error: string | null };

const recipeSchema = z.object({
  product_id: z.string().uuid("Produk wajib dipilih."),
  name: z.string().trim().min(1, "Nama resep wajib diisi."),
  yield_qty: z.coerce.number().gt(0, "Hasil per batch harus lebih dari 0."),
  yield_unit: z.string().trim().optional(),
  overhead_cost: z.coerce.number().min(0, "Biaya overhead tidak boleh negatif."),
  notes: z.string().trim().optional(),
});

export async function createRecipe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recipeSchema.safeParse({
    product_id: formData.get("product_id"),
    name: formData.get("name") || "Resep Standar",
    yield_qty: formData.get("yield_qty") || 1,
    yield_unit: formData.get("yield_unit") || undefined,
    overhead_cost: formData.get("overhead_cost") || 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      ...parsed.data,
      yield_unit: parsed.data.yield_unit || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Gagal menyimpan resep: " + (error?.message ?? "") };

  revalidatePath("/resep");
  redirect(`/resep/${data.id}?msg=` + encodeURIComponent("Resep dibuat. Tambahkan bahan."));
}

export async function updateRecipe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID tidak ditemukan." };

  const parsed = recipeSchema.safeParse({
    product_id: formData.get("product_id"),
    name: formData.get("name"),
    yield_qty: formData.get("yield_qty") || 1,
    yield_unit: formData.get("yield_unit") || undefined,
    overhead_cost: formData.get("overhead_cost") || 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipes")
    .update({
      name: parsed.data.name,
      yield_qty: parsed.data.yield_qty,
      yield_unit: parsed.data.yield_unit || null,
      overhead_cost: parsed.data.overhead_cost,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath(`/resep/${id}`);
  revalidatePath("/resep");
  redirect(`/resep/${id}?msg=` + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteRecipe(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/resep?err=" + encodeURIComponent("ID tidak ditemukan."));

  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    redirect("/resep?err=" + encodeURIComponent("Gagal menghapus: " + error.message));
  }

  revalidatePath("/resep");
  redirect("/resep?msg=" + encodeURIComponent("Resep dihapus."));
}

export async function addRecipeItem(formData: FormData) {
  const recipeId = String(formData.get("recipe_id") ?? "");
  let ingredientId = String(formData.get("ingredient_id") ?? "");
  const newName = String(formData.get("new_name") ?? "").trim();
  const newUnit = String(formData.get("new_unit") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();

  if (!recipeId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect(`/resep/${recipeId}?err=` + encodeURIComponent("Pilih bahan dan isi jumlah > 0."));
  }

  const supabase = await createClient();

  // Allow adding a brand-new bahan (connects to Bahan Baku).
  if (!ingredientId && newName) {
    const id = await findOrCreateIngredient(supabase, newName, { unit: newUnit || unit || "g" });
    ingredientId = id ?? "";
  }
  if (!ingredientId) {
    redirect(`/resep/${recipeId}?err=` + encodeURIComponent("Pilih atau isi nama bahan."));
  }

  const { error } = await supabase.from("recipe_items").insert({
    recipe_id: recipeId,
    ingredient_id: ingredientId,
    quantity,
    unit: unit || newUnit || null,
  });

  if (error) {
    redirect(`/resep/${recipeId}?err=` + encodeURIComponent("Gagal menambah bahan: " + error.message));
  }

  revalidatePath(`/resep/${recipeId}`);
  revalidatePath("/bahan");
  redirect(`/resep/${recipeId}?msg=` + encodeURIComponent("Bahan ditambahkan."));
}

export async function deleteRecipeItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const recipeId = String(formData.get("recipe_id") ?? "");

  const supabase = await createClient();
  await supabase.from("recipe_items").delete().eq("id", id);

  revalidatePath(`/resep/${recipeId}`);
  redirect(`/resep/${recipeId}?msg=` + encodeURIComponent("Bahan dihapus."));
}
