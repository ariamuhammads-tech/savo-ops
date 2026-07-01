"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

const customerSchema = z.object({
  name: z.string().trim().min(1, "Nama pelanggan wajib diisi."),
  type: z.enum(["b2c", "b2b"]),
  business_name: z.string().trim().optional(),
  phone_wa: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  price_tier: z.enum(["b2c", "b2b"]),
  payment_terms_days: z.coerce.number().int().min(0, "Termin tidak boleh negatif."),
  notes: z.string().trim().optional(),
});

function parse(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "b2c",
    business_name: formData.get("business_name") || undefined,
    phone_wa: formData.get("phone_wa") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    price_tier: formData.get("price_tier") || "b2c",
    payment_terms_days: formData.get("payment_terms_days") || 0,
    notes: formData.get("notes") || undefined,
  });
}

function toRow(d: z.infer<typeof customerSchema>) {
  return {
    name: d.name,
    type: d.type,
    business_name: d.business_name || null,
    phone_wa: d.phone_wa || null,
    email: d.email || null,
    address: d.address || null,
    price_tier: d.price_tier,
    payment_terms_days: d.payment_terms_days,
    notes: d.notes || null,
  };
}

export async function createCustomer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(toRow(parsed.data));
  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/pelanggan");
  redirect("/pelanggan?msg=" + encodeURIComponent("Pelanggan ditambahkan."));
}

export async function updateCustomer(
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
    .from("customers")
    .update(toRow(parsed.data))
    .eq("id", id);
  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/pelanggan");
  redirect("/pelanggan?msg=" + encodeURIComponent("Perubahan disimpan."));
}

export async function deleteCustomer(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/pelanggan?err=" + encodeURIComponent("ID tidak ditemukan."));

  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    redirect("/pelanggan?err=" + encodeURIComponent("Gagal menghapus: " + error.message));
  }

  revalidatePath("/pelanggan");
  redirect("/pelanggan?msg=" + encodeURIComponent("Pelanggan dihapus."));
}
