"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geminiGenerate } from "@/lib/gemini";

/** One suggested fix for one field of one row. */
export type Proposal = {
  id: string;
  /** Row label so the user knows which record this is (e.g. product name). */
  rowLabel: string;
  field: string;
  fieldLabel: string;
  current: string;
  proposed: string;
  reason: string;
};

export type AnalyzeResult =
  | { ok: true; proposals: Proposal[]; rowCount: number }
  | { ok: false; error: string };

export type ApplyResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

type FieldDef = { field: string; label: string; hint: string };

type EntityDef = {
  table: "products" | "ingredients" | "customers";
  label: string;
  routes: string[];
  /** Whitelist — the ONLY fields AI may read and we may ever write. */
  fields: FieldDef[];
  extraRules: string;
};

const ENTITIES: Record<string, EntityDef> = {
  produk: {
    table: "products",
    label: "Produk",
    routes: ["/produk"],
    fields: [
      { field: "name", label: "Nama", hint: "nama produk" },
      { field: "category", label: "Kategori", hint: "kategori produk (samakan penulisan kategori yang maksudnya sama)" },
      { field: "unit", label: "Satuan", hint: "satuan jual, gunakan huruf kecil: pack, pcs, box" },
      { field: "notes", label: "Catatan", hint: "catatan bebas" },
    ],
    extraRules:
      "- Satuan yang wajar untuk produk jadi: pack, pcs, box.\n- Jangan mengubah arti nama produk (mis. varian rasa) — hanya rapikan penulisan.",
  },
  bahan: {
    table: "ingredients",
    label: "Bahan Baku",
    routes: ["/bahan"],
    fields: [
      { field: "name", label: "Nama", hint: "nama bahan baku" },
      { field: "unit", label: "Satuan", hint: "satuan stok, gunakan huruf kecil: g, kg, ml, l, pcs" },
      { field: "supplier_name", label: "Supplier", hint: "nama supplier" },
      { field: "notes", label: "Catatan", hint: "catatan bebas" },
    ],
    extraRules:
      "- Satuan yang sah hanya: g, kg, ml, l, pcs.\n- JANGAN mengusulkan konversi angka stok — hanya rapikan teks satuan jika salah tulis (mis. 'gram' -> 'g').",
  },
  pelanggan: {
    table: "customers",
    label: "Pelanggan",
    routes: ["/pelanggan"],
    fields: [
      { field: "name", label: "Nama", hint: "nama kontak" },
      { field: "business_name", label: "Nama Usaha", hint: "nama bisnis/kafe (boleh kosong untuk B2C)" },
      { field: "notes", label: "Catatan", hint: "catatan bebas" },
    ],
    extraRules:
      "- Data kontak (nomor WA, email, alamat) TIDAK dikirim dan tidak boleh diusulkan.",
  },
};

const MAX_ROWS_PER_CALL = 250;

function buildPrompt(def: EntityDef, rows: Record<string, unknown>[]) {
  const fieldList = def.fields
    .map((f) => `- "${f.field}" (${f.label}): ${f.hint}`)
    .join("\n");
  return `Kamu adalah asisten data untuk usaha frozen food rumahan di Indonesia (SAVO).
Tugasmu MERAPIKAN data ${def.label} berikut. Usulkan perbaikan HANYA untuk masalah penulisan:
- Kapitalisasi tidak konsisten (gunakan Title Case untuk nama, mis. "tepung terigu" -> "Tepung Terigu").
- Spasi ganda, spasi di awal/akhir, tanda baca berantakan.
- Salah ketik yang jelas.
- Penulisan yang tidak konsisten antar baris untuk hal yang sama (mis. kategori "rth" vs "RTH" -> pilih satu penulisan yang paling umum/benar).
${def.extraRules}

Aturan ketat:
- JANGAN mengarang data baru. Jika ragu, jangan usulkan.
- JANGAN mengubah makna. Hanya rapikan penulisan.
- Hanya field berikut yang boleh diusulkan:
${fieldList}
- Jika tidak ada yang perlu diperbaiki, kembalikan array kosong.

Data (JSON, satu objek per baris, "id" adalah kunci — jangan diubah):
${JSON.stringify(rows)}

Jawab HANYA dengan JSON valid berbentuk:
{"proposals":[{"id":"<id baris>","field":"<nama field>","proposed":"<nilai baru>","reason":"<alasan singkat bahasa Indonesia>"}]}`;
}

/** Read rows, ask Gemini for cleanup proposals, return a validated preview. */
export async function analyzeEntity(entityKey: string): Promise<AnalyzeResult> {
  const def = ENTITIES[entityKey];
  if (!def) return { ok: false, error: "Jenis data tidak dikenal." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Muat ulang halaman." };

  const cols = ["id", ...def.fields.map((f) => f.field)].join(", ");
  const { data, error } = await supabase
    .from(def.table)
    .select(cols)
    .order("name")
    .limit(1000);
  if (error) return { ok: false, error: "Gagal membaca data dari database." };

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  if (rows.length === 0) {
    return { ok: true, proposals: [], rowCount: 0 };
  }

  // Index rows by id for validation + labels.
  const byId = new Map<string, Record<string, unknown>>();
  for (const r of rows) byId.set(String(r.id), r);
  const fieldByName = new Map(def.fields.map((f) => [f.field, f]));

  const proposals: Proposal[] = [];
  for (let i = 0; i < rows.length; i += MAX_ROWS_PER_CALL) {
    const chunk = rows.slice(i, i + MAX_ROWS_PER_CALL);
    const result = await geminiGenerate(buildPrompt(def, chunk), { json: true });
    if (!result.ok) return { ok: false, error: result.error };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return { ok: false, error: "Jawaban AI bukan JSON valid. Coba analisis ulang." };
    }
    const list: unknown = parsed?.proposals ?? parsed;
    if (!Array.isArray(list)) continue;

    for (const p of list) {
      const id = String(p?.id ?? "");
      const field = String(p?.field ?? "");
      const proposed = typeof p?.proposed === "string" ? p.proposed.trim() : "";
      const row = byId.get(id);
      const fdef = fieldByName.get(field);
      // Hard validation: known row, whitelisted field, real change, sane value.
      if (!row || !fdef) continue;
      if (!proposed && field === "name") continue; // never blank out a name
      if (proposed.length > 300) continue;
      const current = String(row[field] ?? "");
      if (proposed === current) continue;
      proposals.push({
        id,
        rowLabel: String(row.name ?? "(tanpa nama)"),
        field,
        fieldLabel: fdef.label,
        current,
        proposed,
        reason: typeof p?.reason === "string" ? p.reason.slice(0, 200) : "",
      });
    }
  }

  return { ok: true, proposals, rowCount: rows.length };
}

/** Apply the proposals the user ticked. Whitelist-validated again server-side. */
export async function applyProposals(
  entityKey: string,
  picked: { id: string; field: string; proposed: string }[],
): Promise<ApplyResult> {
  const def = ENTITIES[entityKey];
  if (!def) return { ok: false, error: "Jenis data tidak dikenal." };
  if (!Array.isArray(picked) || picked.length === 0) {
    return { ok: false, error: "Tidak ada perubahan yang dipilih." };
  }
  if (picked.length > 500) return { ok: false, error: "Terlalu banyak perubahan sekaligus." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Muat ulang halaman." };

  const allowed = new Set(def.fields.map((f) => f.field));

  // Group per row so one row with several fixes becomes a single UPDATE.
  const perRow = new Map<string, Record<string, string>>();
  for (const p of picked) {
    if (!allowed.has(p.field)) continue;
    const value = String(p.proposed ?? "").trim();
    if (!value && p.field === "name") continue;
    const patch = perRow.get(p.id) ?? {};
    patch[p.field] = value;
    perRow.set(p.id, patch);
  }
  if (perRow.size === 0) return { ok: false, error: "Tidak ada perubahan valid." };

  let updated = 0;
  for (const [id, patch] of perRow) {
    const { error } = await supabase
      .from(def.table)
      .update(patch as never)
      .eq("id", id);
    if (!error) updated += 1;
  }

  for (const route of def.routes) revalidatePath(route);
  revalidatePath("/asisten");
  return { ok: true, updated };
}
