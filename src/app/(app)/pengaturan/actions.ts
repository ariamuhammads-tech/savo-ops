"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null; ok: boolean };

const schema = z.object({
  business_name: z.string().trim().min(1, "Nama bisnis wajib diisi."),
  tagline: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone_wa: z.string().trim().optional(),
  email: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  npwp: z.string().trim().optional(),
  invoice_prefix: z.string().trim().min(1).max(10).optional(),
  tax_percent: z.coerce.number().min(0).max(100),
  bank_name: z.string().trim().optional(),
  bank_account_no: z.string().trim().optional(),
  bank_account_name: z.string().trim().optional(),
  invoice_notes: z.string().trim().optional(),
});

export async function updateBusinessSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse({
    business_name: formData.get("business_name"),
    tagline: formData.get("tagline") || undefined,
    address: formData.get("address") || undefined,
    phone_wa: formData.get("phone_wa") || undefined,
    email: formData.get("email") || undefined,
    instagram: formData.get("instagram") || undefined,
    npwp: formData.get("npwp") || undefined,
    invoice_prefix: formData.get("invoice_prefix") || "INV",
    tax_percent: formData.get("tax_percent") || 0,
    bank_name: formData.get("bank_name") || undefined,
    bank_account_no: formData.get("bank_account_no") || undefined,
    bank_account_name: formData.get("bank_account_name") || undefined,
    invoice_notes: formData.get("invoice_notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const row = {
    business_name: parsed.data.business_name,
    tagline: parsed.data.tagline || null,
    address: parsed.data.address || null,
    phone_wa: parsed.data.phone_wa || null,
    email: parsed.data.email || null,
    instagram: parsed.data.instagram || null,
    npwp: parsed.data.npwp || null,
    invoice_prefix: parsed.data.invoice_prefix || "INV",
    tax_percent: parsed.data.tax_percent,
    bank_name: parsed.data.bank_name || null,
    bank_account_no: parsed.data.bank_account_no || null,
    bank_account_name: parsed.data.bank_account_name || null,
    invoice_notes: parsed.data.invoice_notes || null,
  };

  const { error } = id
    ? await supabase.from("business_settings").update(row).eq("id", id)
    : await supabase.from("business_settings").insert(row);

  if (error) return { ok: false, error: "Gagal menyimpan: " + error.message };

  revalidatePath("/pengaturan");
  return { ok: true, error: null };
}
