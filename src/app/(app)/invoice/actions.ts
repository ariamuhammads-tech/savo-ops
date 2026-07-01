"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInvoiceFromOrder(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  if (!orderId) redirect("/pesanan?err=" + encodeURIComponent("Pesanan tidak ditemukan."));

  const supabase = await createClient();

  // Reuse an existing invoice for this order if any.
  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) {
    redirect(`/invoice/${existing.id}`);
  }

  const { data: order } = await supabase
    .from("orders")
    .select("total, customer_id, payment_status")
    .eq("id", orderId)
    .single();
  if (!order) redirect(`/pesanan/${orderId}?err=` + encodeURIComponent("Pesanan tidak ditemukan."));

  const [{ data: settings }, { data: customer }] = await Promise.all([
    supabase.from("business_settings").select("invoice_prefix").limit(1).maybeSingle(),
    order!.customer_id
      ? supabase.from("customers").select("payment_terms_days").eq("id", order!.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const prefix = settings?.invoice_prefix || "INV";
  const year = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", year: "numeric" });

  const { data: seq, error: seqErr } = await supabase.rpc("next_seq", {
    p_name: `invoice-${year}`,
  });
  if (seqErr) redirect(`/pesanan/${orderId}?err=` + encodeURIComponent("Gagal membuat nomor invoice."));
  const invoiceNo = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;

  // issue + due dates (WIB)
  const issue = new Date();
  const issueStr = issue.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 10);
  const terms = Number(customer?.payment_terms_days ?? 0);
  let dueStr: string | null = null;
  if (terms > 0) {
    const due = new Date(issue.getTime() + terms * 86400000);
    dueStr = due.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 10);
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      invoice_no: invoiceNo,
      order_id: orderId,
      customer_id: order!.customer_id,
      issue_date: issueStr,
      due_date: dueStr,
      total: Number(order!.total),
      status: order!.payment_status === "paid" ? "paid" : "sent",
    })
    .select("id")
    .single();

  if (error || !invoice) {
    redirect(`/pesanan/${orderId}?err=` + encodeURIComponent("Gagal membuat invoice: " + (error?.message ?? "")));
  }

  revalidatePath("/invoice");
  revalidatePath(`/pesanan/${orderId}`);
  redirect(`/invoice/${invoice.id}?msg=` + encodeURIComponent(`Invoice ${invoiceNo} dibuat.`));
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) redirect(`/invoice/${id}?err=` + encodeURIComponent("Gagal menghapus."));
  revalidatePath("/invoice");
  redirect("/invoice?msg=" + encodeURIComponent("Invoice dihapus."));
}
