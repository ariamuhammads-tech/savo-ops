"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { convertQty } from "@/lib/units";

export type FormState = { error: string | null };

type LineInput = {
  /** "bahan" (default) atau "equipment" — review 2026-07-06. */
  item_type?: "bahan" | "equipment";
  ingredient_id: string | null;
  equipment_id?: string | null;
  name: string;
  unit?: string | null;
  /** Satuan saat membeli (bisa beda keluarga g/kg, ml/l dari satuan induk). */
  buy_unit?: string | null;
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
    (l) =>
      Number(l.qty) > 0 &&
      (l.item_type === "equipment"
        ? l.equipment_id
        : l.ingredient_id || (l.name && l.name.trim())),
  );
  if (lines.length === 0) return { error: "Tambahkan minimal satu item." };

  const supabase = await createClient();

  // Resolve ingredients: a line may reference an existing ingredient OR a
  // brand-new one typed here — find-or-create so it connects to Bahan Baku.
  // (Equipment lines always reference an existing item — skipped here.)
  for (const l of lines) {
    if (l.item_type === "equipment") continue;
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
          avg_unit_cost: Number(l.unit_cost) || 0,
          notes: "Dari pembelian",
        })
        .select("id")
        .single();
      l.ingredient_id = created?.id ?? null;
    }
  }
  lines = lines.filter((l) =>
    l.item_type === "equipment" ? l.equipment_id : l.ingredient_id,
  );
  if (lines.length === 0) return { error: "Gagal memproses item." };

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

  // Konversi setiap baris ke SATUAN INDUK bahan sebelum apa pun disimpan
  // (review 2026-07-06: satuan pembelian bisa beda — mis. beli gram untuk
  // bahan ber-satuan kg). Subtotal rupiah tidak berubah oleh konversi.
  const prepared: {
    l: LineInput;
    qtyMaster: number;
    pricePerMaster: number;
  }[] = [];
  for (const l of lines) {
    const isEquip = l.item_type === "equipment";
    const table = isEquip ? "equipment" : "ingredients";
    const targetId = isEquip ? l.equipment_id : l.ingredient_id;
    if (!targetId) continue;
    const { data: unitRow } = await supabase
      .from(table)
      .select("unit")
      .eq("id", targetId)
      .single();
    const masterUnit = unitRow?.unit ?? l.unit ?? "";
    const qty = Number(l.qty);
    const price = Number(l.unit_cost);
    const qtyMaster = convertQty(qty, l.buy_unit ?? masterUnit, masterUnit) ?? qty;
    const pricePerMaster =
      qtyMaster > 0 ? round2((qty * price) / qtyMaster) : price;
    prepared.push({ l, qtyMaster, pricePerMaster });
  }

  const items = prepared.map(({ l, qtyMaster, pricePerMaster }) => ({
    purchase_id: purchase.id,
    ingredient_id: l.item_type === "equipment" ? null : l.ingredient_id,
    equipment_id: l.item_type === "equipment" ? (l.equipment_id ?? null) : null,
    name: l.name,
    qty: qtyMaster,
    unit_cost: pricePerMaster,
    subtotal: round2(Number(l.qty) * Number(l.unit_cost)),
  }));
  await supabase.from("purchase_items").insert(items);

  // Apply to stock: increment qty, roll the weighted-average cost, log movement.
  for (const { l, qtyMaster, pricePerMaster } of prepared) {
    const isEquip = l.item_type === "equipment";
    const table = isEquip ? ("equipment" as const) : ("ingredients" as const);
    const targetId = isEquip ? l.equipment_id : l.ingredient_id;
    if (!targetId) continue;
    const { data: ing } = await supabase
      .from(table)
      .select("stock_qty, avg_unit_cost, last_unit_cost")
      .eq("id", targetId)
      .single();
    if (!ing) continue;
    const qty = qtyMaster;
    const price = pricePerMaster;
    const newQty = Number(ing.stock_qty) + qty;

    // Biaya rata-rata tertimbang: nilai stok lama dicampur dengan pembelian
    // baru, sehingga HPP mengikuti harga terbaru TANPA memutus hubungan
    // dengan stok lama yang masih ada.
    //   avg_baru = (stok_lama × avg_lama + qty_beli × harga_beli) / total_qty
    const oldQty = Math.max(0, Number(ing.stock_qty)); // stok minus: abaikan untuk biaya
    const oldAvg =
      Number(ing.avg_unit_cost) > 0
        ? Number(ing.avg_unit_cost)
        : Number(ing.last_unit_cost) > 0
          ? Number(ing.last_unit_cost)
          : price;
    const newAvg =
      oldQty + qty > 0 ? round2((oldQty * oldAvg + qty * price) / (oldQty + qty)) : price;

    if (isEquip) {
      await supabase
        .from("equipment")
        .update({ stock_qty: newQty, last_unit_cost: price, avg_unit_cost: newAvg })
        .eq("id", targetId);
    } else {
      await supabase
        .from("ingredients")
        .update({
          stock_qty: newQty,
          last_unit_cost: price,
          avg_unit_cost: newAvg,
          // Pemasok master terisi otomatis dari pembelian terakhir.
          ...(supplier ? { supplier_name: supplier } : {}),
        })
        .eq("id", targetId);
    }
    await supabase.from("stock_movements").insert({
      item_type: isEquip ? "equipment" : "ingredient",
      item_id: targetId,
      movement_type: "purchase",
      qty_change: qty, // sudah dalam satuan induk
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

  // Reverse the stock quantities added by this purchase (bahan & equipment).
  const { data: items } = await supabase
    .from("purchase_items")
    .select("ingredient_id, equipment_id, qty")
    .eq("purchase_id", id);
  for (const it of items ?? []) {
    const isEquip = Boolean(it.equipment_id);
    const table = isEquip ? ("equipment" as const) : ("ingredients" as const);
    const targetId = isEquip ? it.equipment_id : it.ingredient_id;
    if (!targetId) continue;
    const { data: ing } = await supabase
      .from(table)
      .select("stock_qty")
      .eq("id", targetId)
      .single();
    if (!ing) continue;
    const newQty = Number(ing.stock_qty) - Number(it.qty);
    await supabase.from(table).update({ stock_qty: newQty }).eq("id", targetId);
    await supabase.from("stock_movements").insert({
      item_type: isEquip ? "equipment" : "ingredient",
      item_id: targetId,
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
