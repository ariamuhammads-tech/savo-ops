"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

type LineInput = {
  product_id: string | null;
  name: string;
  qty: number;
  unit_price: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function recomputePaymentStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
) {
  const [{ data: order }, { data: pays }] = await Promise.all([
    supabase.from("orders").select("total").eq("id", orderId).single(),
    supabase.from("payments").select("amount, status").eq("order_id", orderId),
  ]);
  if (!order) return;
  const paid = (pays ?? [])
    .filter((p) => p.status === "settled")
    .reduce((s, p) => s + Number(p.amount), 0);
  const total = Number(order.total);
  const status = paid <= 0 ? "unpaid" : paid + 0.5 >= total ? "paid" : "partial";
  await supabase.from("orders").update({ payment_status: status }).eq("id", orderId);
}

export async function createOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const customerId = String(formData.get("customer_id") ?? "") || null;
  const channel = String(formData.get("channel") ?? "wa");
  const orderDate = String(formData.get("order_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const discount = Number(formData.get("discount") ?? 0) || 0;
  const shipping = Number(formData.get("shipping") ?? 0) || 0;
  const tax = Number(formData.get("tax") ?? 0) || 0;

  let lines: LineInput[] = [];
  try {
    lines = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Item pesanan tidak valid." };
  }
  lines = lines.filter((l) => Number(l.qty) > 0 && (l.product_id || l.name));
  if (lines.length === 0) return { error: "Tambahkan minimal satu produk." };

  const subtotal = round2(
    lines.reduce((s, l) => s + Number(l.qty) * Number(l.unit_price), 0),
  );
  const total = round2(subtotal - discount + shipping + tax);

  const supabase = await createClient();

  const year = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  });
  const { data: seq, error: seqErr } = await supabase.rpc("next_seq", {
    p_name: `order-${year}`,
  });
  if (seqErr) return { error: "Gagal membuat nomor pesanan: " + seqErr.message };
  const orderNo = `SO-${year}-${String(seq).padStart(4, "0")}`;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_no: orderNo,
      customer_id: customerId,
      channel: channel as "wa" | "ig" | "b2b" | "other",
      order_date: orderDate || undefined,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      contact_name: contactName || null,
      contact_phone: contactPhone || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !order) return { error: "Gagal menyimpan pesanan: " + (error?.message ?? "") };

  const items = lines.map((l) => ({
    order_id: order.id,
    product_id: l.product_id,
    name: l.name,
    qty: Number(l.qty),
    unit_price: Number(l.unit_price),
    subtotal: round2(Number(l.qty) * Number(l.unit_price)),
  }));
  const { error: itemsErr } = await supabase.from("order_items").insert(items);
  if (itemsErr) return { error: "Gagal menyimpan item: " + itemsErr.message };

  revalidatePath("/pesanan");
  redirect(`/pesanan/${order.id}?msg=` + encodeURIComponent(`Pesanan ${orderNo} dibuat.`));
}

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) redirect(`/pesanan/${id}?err=` + encodeURIComponent("Status tidak valid."));

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("stock_applied, status")
    .eq("id", id)
    .single();
  if (!order) redirect("/pesanan?err=" + encodeURIComponent("Pesanan tidak ditemukan."));

  // Deduct stock once when the order reaches delivered/completed.
  const shouldApply =
    (status === "delivered" || status === "completed") && !order!.stock_applied;

  if (shouldApply) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, qty")
      .eq("order_id", id);

    for (const it of items ?? []) {
      if (!it.product_id) continue;
      const { data: prod } = await supabase
        .from("products")
        .select("stock_qty")
        .eq("id", it.product_id)
        .single();
      if (!prod) continue;
      const newQty = Number(prod.stock_qty) - Number(it.qty);
      await supabase.from("products").update({ stock_qty: newQty }).eq("id", it.product_id);
      await supabase.from("stock_movements").insert({
        item_type: "product",
        item_id: it.product_id,
        movement_type: "sale",
        qty_change: -Number(it.qty),
        balance_after: newQty,
        ref_type: "order",
        ref_id: id,
      });
    }
  }

  await supabase
    .from("orders")
    .update({ status: status as never, stock_applied: order!.stock_applied || shouldApply })
    .eq("id", id);

  revalidatePath(`/pesanan/${id}`);
  revalidatePath("/pesanan");
  redirect(`/pesanan/${id}?msg=` + encodeURIComponent("Status diperbarui."));
}

export async function deleteOrder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) redirect(`/pesanan/${id}?err=` + encodeURIComponent("Gagal menghapus."));
  revalidatePath("/pesanan");
  redirect("/pesanan?msg=" + encodeURIComponent("Pesanan dihapus."));
}

export async function addPayment(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "transfer");
  const reference = String(formData.get("reference") ?? "").trim();
  const paidAt = String(formData.get("paid_at") ?? "");

  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    redirect(`/pesanan/${orderId}?err=` + encodeURIComponent("Jumlah pembayaran tidak valid."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    method: method as "cash" | "transfer" | "qris" | "other",
    reference: reference || null,
    paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
  });
  if (error) {
    redirect(`/pesanan/${orderId}?err=` + encodeURIComponent("Gagal mencatat pembayaran."));
  }

  await recomputePaymentStatus(supabase, orderId);
  revalidatePath(`/pesanan/${orderId}`);
  revalidatePath("/pembayaran");
  redirect(`/pesanan/${orderId}?msg=` + encodeURIComponent("Pembayaran dicatat."));
}

export async function deletePayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");
  const supabase = await createClient();
  await supabase.from("payments").delete().eq("id", id);
  await recomputePaymentStatus(supabase, orderId);
  revalidatePath(`/pesanan/${orderId}`);
  revalidatePath("/pembayaran");
  redirect(`/pesanan/${orderId}?msg=` + encodeURIComponent("Pembayaran dihapus."));
}
