"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

type LineInput = {
  ingredient_id: string | null;
  name: string;
  unit?: string | null;
  qty: number;
  unit_cost: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function recordPurchase(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supplier = String(formData.get("supplier_name") ?? "").trim();
  const date = String(formData.get("purchase_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  let lines: LineInput[] = [];
  try {
    lines = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Item pembelian tidak valid." };
  }
  lines = lines.filter(
    (l) => Number(l.qty) > 0 && (l.ingredient_id || (l.name && l.name.trim())),
  );
  if (lines.length === 0) return { error: "Tambahkan minimal satu bahan." };

  const supabase = await createClient();

  // Resolve ingredients: a line may reference an existing ingredient OR a
  // brand-new one typed here — find-or-create so it connects to Bahan Baku.
  for (const l of lines) {
    if (l.ingredient_id) continue;
    const nm = (l.name ?? "").trim();
    if (!nm) continue;
    const { data: existing } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("name", nm)
      .limit(1)
      .maybeSingle();
    if (existing) {
      l.ingredient_id = existing.id;
    } else {
      const { data: created } = await supabase
        .from("ingredients")
        .insert({
          name: nm,
          unit: l.unit || "g",
          last_unit_cost: Number(l.unit_cost) || 0,
          notes: "Dari pembelian",
        })
        .select("id")
        .single();
      l.ingredient_id = created?.id ?? null;
    }
  }
  lines = lines.filter((l) => l.ingredient_id);
  if (lines.length === 0) return { error: "Gagal memproses bahan." };

  const total = round2(lines.reduce((s, l) => s + Number(l.qty) * Number(l.unit_cost), 0));

  const year = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta", year: "numeric" });
  const { data: seq, error: seqErr } = await supabase.rpc("next_seq", { p_name: `purchase-${year}` });
  if (seqErr) return { error: "Gagal membuat nomor: " + seqErr.message };
  const purchaseNo = `PB-${year}-${String(seq).padStart(4, "0")}`;

  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({
      purchase_no: purchaseNo,
      supplier_name: supplier || null,
      purchase_date: date || undefined,
      total,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error || !purchase) return { error: "Gagal menyimpan: " + (error?.message ?? "") };

  const items = lines.map((l) => ({
    purchase_id: purchase.id,
    ingredient_id: l.ingredient_id,
    name: l.name,
    qty: Number(l.qty),
    unit_cost: Number(l.unit_cost),
    subtotal: round2(Number(l.qty) * Number(l.unit_cost)),
  }));
  await supabase.from("purchase_items").insert(items);

  // Apply to stock: increment qty, update last_unit_cost, log movement.
  for (const l of lines) {
    if (!l.ingredient_id) continue;
    const { data: ing } = await supabase
      .from("ingredients")
      .select("stock_qty")
      .eq("id", l.ingredient_id)
      .single();
    if (!ing) continue;
    const newQty = Number(ing.stock_qty) + Number(l.qty);
    await supabase
      .from("ingredients")
      .update({ stock_qty: newQty, last_unit_cost: Number(l.unit_cost) })
      .eq("id", l.ingredient_id);
    await supabase.from("stock_movements").insert({
      item_type: "ingredient",
      item_id: l.ingredient_id,
      movement_type: "purchase",
      qty_change: Number(l.qty),
      balance_after: newQty,
      ref_type: "purchase",
      ref_id: purchase.id,
    });
  }

  revalidatePath("/pembelian");
  revalidatePath("/bahan");
  redirect(`/pembelian/${purchase.id}?msg=` + encodeURIComponent(`Pembelian ${purchaseNo} dicatat, stok bertambah.`));
}

export async function deletePurchase(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  // Reverse the stock quantities added by this purchase.
  const { data: items } = await supabase
    .from("purchase_items")
    .select("ingredient_id, qty")
    .eq("purchase_id", id);
  for (const it of items ?? []) {
    if (!it.ingredient_id) continue;
    const { data: ing } = await supabase
      .from("ingredients")
      .select("stock_qty")
      .eq("id", it.ingredient_id)
      .single();
    if (!ing) continue;
    const newQty = Number(ing.stock_qty) - Number(it.qty);
    await supabase.from("ingredients").update({ stock_qty: newQty }).eq("id", it.ingredient_id);
    await supabase.from("stock_movements").insert({
      item_type: "ingredient",
      item_id: it.ingredient_id,
      movement_type: "adjustment",
      qty_change: -Number(it.qty),
      balance_after: newQty,
      ref_type: "purchase_void",
      ref_id: id,
      notes: "Pembatalan pembelian",
    });
  }

  await supabase.from("purchases").delete().eq("id", id);
  revalidatePath("/pembelian");
  revalidatePath("/bahan");
  redirect("/pembelian?msg=" + encodeURIComponent("Pembelian dihapus, stok dikembalikan."));
}
