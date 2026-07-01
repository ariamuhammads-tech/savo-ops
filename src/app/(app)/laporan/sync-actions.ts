"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sheetGet, sheetReplace, sheetConfigured, type SheetRow } from "@/lib/gsheet";

export type SyncType = "produk" | "bahan";
export type SyncResult = {
  ok: boolean;
  error?: string;
  pulled?: number; // sheet -> db (insert+update)
  pushed?: number; // db rows written to sheet
};

type FieldMap = {
  header: string;
  field: string;
  kind: "text" | "number" | "bool";
};

const CONFIG: Record<
  SyncType,
  { table: string; key: "sku" | "name"; fields: FieldMap[] }
> = {
  produk: {
    table: "products",
    key: "sku",
    fields: [
      { header: "SKU", field: "sku", kind: "text" },
      { header: "Nama", field: "name", kind: "text" },
      { header: "Kategori", field: "category", kind: "text" },
      { header: "Satuan", field: "unit", kind: "text" },
      { header: "Berat (g)", field: "weight_grams", kind: "number" },
      { header: "Harga B2C", field: "price_b2c", kind: "number" },
      { header: "Harga B2B", field: "price_b2b", kind: "number" },
      { header: "Stok", field: "stock_qty", kind: "number" },
      { header: "Stok Min", field: "min_stock", kind: "number" },
      { header: "Aktif", field: "is_active", kind: "bool" },
      { header: "Catatan", field: "notes", kind: "text" },
    ],
  },
  bahan: {
    table: "ingredients",
    key: "name",
    fields: [
      { header: "Nama", field: "name", kind: "text" },
      { header: "Satuan", field: "unit", kind: "text" },
      { header: "Stok", field: "stock_qty", kind: "number" },
      { header: "Stok Min", field: "min_stock", kind: "number" },
      { header: "Harga Beli Terakhir", field: "last_unit_cost", kind: "number" },
      { header: "Pemasok", field: "supplier_name", kind: "text" },
      { header: "Catatan", field: "notes", kind: "text" },
    ],
  },
};

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
}
function ts(v: unknown): number {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : 0;
}

// Sheet row -> DB field object
function sheetToDb(cfg: (typeof CONFIG)[SyncType], row: SheetRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const raw = row[f.header];
    if (f.kind === "number") out[f.field] = num(raw);
    else if (f.kind === "bool") out[f.field] = /^(ya|true|1|aktif)$/i.test(String(raw ?? ""));
    else out[f.field] = String(raw ?? "").trim() || null;
  }
  return out;
}

// DB row -> sheet row object (with updated_at)
function dbToSheet(cfg: (typeof CONFIG)[SyncType], row: Record<string, unknown>): SheetRow {
  const out: SheetRow = {};
  for (const f of cfg.fields) {
    const v = row[f.field];
    if (f.kind === "bool") out[f.header] = v ? "Ya" : "Tidak";
    else if (v === null || v === undefined) out[f.header] = "";
    else out[f.header] = v as string | number;
  }
  out["updated_at"] = String(row.updated_at ?? "");
  return out;
}

function keyOf(cfg: (typeof CONFIG)[SyncType], obj: Record<string, unknown>): string {
  if (cfg.key === "sku") {
    const sku = String(obj.sku ?? "").trim();
    if (sku) return "sku:" + sku.toLowerCase();
  }
  return "name:" + String(obj.name ?? "").trim().toLowerCase();
}

export async function syncSheet(type: SyncType): Promise<SyncResult> {
  if (!sheetConfigured()) {
    return { ok: false, error: "Google Sheets belum dihubungkan (env belum diisi)." };
  }
  const cfg = CONFIG[type];
  const supabase = await createClient();

  let sheetRows: SheetRow[];
  try {
    sheetRows = await sheetGet(type);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { data: dbData } = await supabase.from(cfg.table).select("*");
  const dbRows = dbData ?? [];

  const dbByKey = new Map<string, Record<string, unknown>>();
  for (const r of dbRows) dbByKey.set(keyOf(cfg, r), r);
  const sheetByKey = new Map<string, SheetRow>();
  for (const r of sheetRows) sheetByKey.set(keyOf(cfg, sheetToDb(cfg, r) as Record<string, unknown>), r);

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown> }[] = [];

  for (const [k, sh] of sheetByKey) {
    const db = dbByKey.get(k);
    const mapped = sheetToDb(cfg, sh);
    if (!mapped.name) continue; // skip empty
    if (!db) {
      inserts.push(mapped);
    } else {
      const sheetT = ts(sh["updated_at"]);
      const dbT = ts(db.updated_at);
      if (sheetT > dbT) updates.push({ id: String(db.id), row: mapped });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = () => supabase.from(cfg.table) as any;
  try {
    if (inserts.length) {
      const { error } = await tbl().insert(inserts);
      if (error) throw error;
    }
    for (const u of updates) {
      const { error } = await tbl().update(u.row).eq("id", u.id);
      if (error) throw error;
    }
  } catch (e) {
    return { ok: false, error: "Gagal tulis DB: " + (e as Error).message };
  }

  // Push full DB state back to the sheet.
  const { data: fresh } = await supabase.from(cfg.table).select("*").order("name");
  const outRows = (fresh ?? []).map((r) => dbToSheet(cfg, r));
  try {
    await sheetReplace(type, outRows);
  } catch (e) {
    return { ok: false, error: "Berhasil tarik, gagal dorong ke Sheet: " + (e as Error).message };
  }

  revalidatePath(`/${type}`);
  return { ok: true, pulled: inserts.length + updates.length, pushed: outRows.length };
}
