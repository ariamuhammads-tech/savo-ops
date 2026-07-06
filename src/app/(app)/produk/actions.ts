"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(1, "Nama produk wajib diisi."),
  category: z.string().trim().optional(),
  unit: z.string().trim().min(1, "Satuan wajib diisi."),
  weight_grams: z.coerce.number().min(0).optional(),
  price_b2c: z.coerce.number().min(0, "Harga B2C tidak boleh negatif."),
  price_b2b: z.coerce.number().min(0, "Harga B2B tidak boleh negatif."),
  stock_qty: z.coerce.number().min(0, "Stok tidak boleh negatif."),
  min_stock: z.coerce.number().min(0, "Stok minimum tidak boleh negatif."),
  is_active: z.boolean(),
  notes: z.string().trim().optional(),
});

function parse(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get("sku") || undefined,
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || "pack",
    weight_grams: formData.get("weight_grams") || undefined,
    price_b2c: formData.get("price_b2c") || 0,
    price_b2b: formData.get("price_b2b") || 0,
    stock_qty: formData.get("stock_qty") || 0,
    min_stock: formData.get("min_stock") || 0,
    is_active: formData.get("is_active") === "true",
    notes: formData.get("notes") || undefined,
  });
}

function toRow(data: z.infer<typeof productSchema>) {
  return {
    sku: data.sku || null,
    name: data.name,
    category: data.category || null,
    unit: data.unit,
    weight_grams: data.weight_grams ?? null,
    price_b2c: data.price_b2c,
    price_b2b: data.price_b2b,
    stock_qty: data.stock_qty,
    min_stock: data.min_stock,
    is_active: data.is_active,
    notes: data.notes || null,
  };
}

export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(toRow(parsed.data));

  if (error) {
    if (error.code === "23505") return { error: "SKU sudah dipakai produk lain." };
    return { error: "Gagal menyimpan: " + error.message };
  }

  revalidatePath("/produk");
  redirect("/produk?msg=" + encodeURIComponent("Produk ditambahkan."));
}

export async function updateProduct(
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
  const { error } = await supabase
    .from("products")
    .update(toRow(parsed.data))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "SKU sudah dipakai produk lain." };
    return { error: "Gagal menyimpan: " + error.message };
  }

  revalidatePath("/produk");
  redirect("/produk?msg=" + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/produk?err=" + encodeURIComponent("ID tidak ditemukan."));

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    redirect("/produk?err=" + encodeURIComponent("Gagal menghapus: " + error.message));
  }

  revalidatePath("/produk");
  redirect("/produk?msg=" + encodeURIComponent("Produk dihapus."));
}

export async function adjustProductStock(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const delta = Number(formData.get("qty_change") ?? 0);
  const note = String(formData.get("notes") ?? "").trim();

  if (!id || !Number.isFinite(delta) || delta === 0) {
    redirect(`/produk/${id}?err=` + encodeURIComponent("Jumlah penyesuaian tidak valid."));
  }

  const supabase = await createClient();
  const { data: prod, error: readErr } = await supabase
    .from("products")
    .select("stock_qty")
    .eq("id", id)
    .single();

  if (readErr || !prod) {
    redirect(`/produk/${id}?err=` + encodeURIComponent("Produk tidak ditemukan."));
  }

  const newQty = Number(prod!.stock_qty) + delta;
  if (newQty < 0) {
    redirect(`/produk/${id}?err=` + encodeURIComponent("Stok hasil tidak boleh negatif."));
  }

  const { error: updErr } = await supabase
    .from("products")
    .update({ stock_qty: newQty })
    .eq("id", id);
  if (updErr) {
    redirect(`/produk/${id}?err=` + encodeURIComponent("Gagal memperbarui stok."));
  }

  await supabase.from("stock_movements").insert({
    item_type: "product",
    item_id: id,
    movement_type: "adjustment",
    qty_change: delta,
    balance_after: newQty,
    notes: note || null,
  });

  revalidatePath("/produk");
  revalidatePath(`/produk/${id}`);
  redirect("/produk?msg=" + encodeURIComponent("Stok disesuaikan."));
}

/**
 * Terapkan harga jual baru dari slider target margin (review 2026-07-06 #2).
 * Dipanggil dari PriceSlider di halaman Resep & Produk.
 */
export async function applyPricesFromMargin(
  productId: string,
  priceB2c: number,
  priceB2b: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const b2c = Number(priceB2c);
  const b2b = Number(priceB2b);
  if (!productId || !Number.isFinite(b2c) || !Number.isFinite(b2b) || b2c < 0 || b2b < 0) {
    return { ok: false, error: "Harga tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Muat ulang halaman." };

  const { error } = await supabase
    .from("products")
    .update({ price_b2c: b2c, price_b2b: b2b })
    .eq("id", productId);
  if (error) return { ok: false, error: "Gagal menyimpan: " + error.message };

  revalidatePath("/produk");
  revalidatePath("/resep");
  return { ok: true };
}
