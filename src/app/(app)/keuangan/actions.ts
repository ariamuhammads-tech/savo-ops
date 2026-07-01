"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

const schema = z.object({
  expense_date: z.string().trim().min(1),
  category: z.string().trim().optional(),
  description: z.string().trim().min(1, "Keterangan wajib diisi."),
  amount: z.coerce.number().gt(0, "Jumlah harus lebih dari 0."),
  notes: z.string().trim().optional(),
});

export async function addExpense(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse({
    expense_date: formData.get("expense_date"),
    category: formData.get("category") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount") || 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    expense_date: parsed.data.expense_date,
    category: parsed.data.category || null,
    description: parsed.data.description,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/keuangan");
  redirect("/keuangan?msg=" + encodeURIComponent("Pengeluaran dicatat."));
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/keuangan");
  redirect("/keuangan?msg=" + encodeURIComponent("Pengeluaran dihapus."));
}
