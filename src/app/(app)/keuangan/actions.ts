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
  is_reimbursement: z.boolean(),
  reimburse_to: z.string().trim().optional(),
  reimburse_status: z.enum(["pending", "paid"]),
  photo_url: z.string().trim().optional(),
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
    is_reimbursement: formData.get("is_reimbursement") === "true",
    reimburse_to: formData.get("reimburse_to") || undefined,
    reimburse_status: formData.get("reimburse_status") === "paid" ? "paid" : "pending",
    photo_url: formData.get("photo_url") || undefined,
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
    is_reimbursement: parsed.data.is_reimbursement,
    reimburse_to: parsed.data.reimburse_to || null,
    reimburse_status: parsed.data.reimburse_status,
    photo_url: parsed.data.photo_url || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/keuangan");
  redirect("/keuangan?msg=" + encodeURIComponent("Pengeluaran dicatat."));
}

/** Toggle a reimbursement's paid status. */
export async function toggleReimburseStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "pending");
  const supabase = await createClient();
  await supabase
    .from("expenses")
    .update({ reimburse_status: to === "paid" ? "paid" : "pending" })
    .eq("id", id);
  revalidatePath("/keuangan");
  redirect("/keuangan?msg=" + encodeURIComponent("Status reimbursement diperbarui."));
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/keuangan");
  redirect("/keuangan?msg=" + encodeURIComponent("Pengeluaran dihapus."));
}
