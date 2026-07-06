"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

// Catatan: file "use server" hanya boleh mengekspor async function —
// konstanta ini sengaja TIDAK diekspor (form punya daftarnya sendiri).
const EQUIPMENT_CATEGORIES = [
  "Equipment",
  "Tools",
  "Consumable",
  "Kelengkapan",
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  category: z.enum(EQUIPMENT_CATEGORIES),
  unit: z.string().trim().min(1, "Satuan wajib diisi."),
  stock_qty: z.coerce.number().min(0, "Stok tidak boleh negatif."),
  min_stock: z.coerce.number().min(0, "Minimum tidak boleh negatif."),
  last_unit_cost: z.coerce.number().min(0, "Harga tidak boleh negatif."),
  notes: z.string().trim().optional(),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") || "Equipment",
    unit: formData.get("unit") || "pcs",
    stock_qty: formData.get("stock_qty") || 0,
    min_stock: formData.get("min_stock") || 0,
    last_unit_cost: formData.get("last_unit_cost") || 0,
    notes: formData.get("notes") || undefined,
  });
}

export async function createEquipment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    ...parsed.data,
    avg_unit_cost: parsed.data.last_unit_cost,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: "Gagal menyimpan: " + error.message };
  revalidatePath("/equipment");
  redirect("/equipment?msg=" + encodeURIComponent("Item ditambahkan."));
}

export async function updateEquipment(
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
  // Perubahan harga manual = override sadar → rata-rata ikut di-reset
  // (aturan yang sama dengan Bahan Baku).
  const { data: current } = await supabase
    .from("equipment")
    .select("last_unit_cost")
    .eq("id", id)
    .single();
  const priceChanged =
    !current || Number(current.last_unit_cost) !== parsed.data.last_unit_cost;
  const { error } = await supabase
    .from("equipment")
    .update({
      ...parsed.data,
      ...(priceChanged ? { avg_unit_cost: parsed.data.last_unit_cost } : {}),
      notes: parsed.data.notes || null,
    })
    .eq("id", id);
  if (error) return { error: "Gagal menyimpan: " + error.message };
  revalidatePath("/equipment");
  redirect("/equipment?msg=" + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteEquipment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/equipment?err=" + encodeURIComponent("ID tidak ditemukan."));
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error) {
    redirect("/equipment?err=" + encodeURIComponent("Gagal menghapus: " + error.message));
  }
  revalidatePath("/equipment");
  redirect("/equipment?msg=" + encodeURIComponent("Item dihapus."));
}
