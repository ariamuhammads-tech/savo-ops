"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sheetGet, sheetReplace, sheetConfigured, type SheetRow } from "@/lib/gsheet";
import {
  STATUS_LABEL,
  CHANNEL_LABEL,
  PAYMENT_STATUS_LABEL,
  METHOD_LABEL,
} from "../pesanan/labels";

export type SyncResult = {
  ok: boolean;
  error?: string;
  pulled?: number;
  pushed?: number;
};

type SB = Awaited<ReturnType<typeof createClient>>;
type Kind = "text" | "number" | "bool";
type FieldMap = { header: string; field: string; kind: Kind };

// ------- Two-way (master data with a natural key) -------
const TWOWAY = {
  produk: {
    table: "products",
    key: "sku" as const,
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
    ] as FieldMap[],
  },
  bahan: {
    table: "ingredients",
    key: "name" as const,
    fields: [
      { header: "Nama", field: "name", kind: "text" },
      { header: "Satuan", field: "unit", kind: "text" },
      { header: "Stok", field: "stock_qty", kind: "number" },
      { header: "Stok Min", field: "min_stock", kind: "number" },
      { header: "Harga Beli Terakhir", field: "last_unit_cost", kind: "number" },
      { header: "Pemasok", field: "supplier_name", kind: "text" },
      { header: "Catatan", field: "notes", kind: "text" },
    ] as FieldMap[],
  },
  pelanggan: {
    table: "customers",
    key: "name" as const,
    fields: [
      { header: "Nama", field: "name", kind: "text" },
      { header: "Tipe", field: "type", kind: "text" },
      { header: "Nama Bisnis", field: "business_name", kind: "text" },
      { header: "No. WhatsApp", field: "phone_wa", kind: "text" },
      { header: "Email", field: "email", kind: "text" },
      { header: "Alamat", field: "address", kind: "text" },
      { header: "Tier Harga", field: "price_tier", kind: "text" },
      { header: "Termin (hari)", field: "payment_terms_days", kind: "number" },
      { header: "Catatan", field: "notes", kind: "text" },
    ] as FieldMap[],
  },
};

// ------- Push-only (transactional; app → sheet) -------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = (o: any, ...path: string[]) => path.reduce((a, k) => (a ? a[k] : undefined), o);

const PUSH: Record<
  string,
  { headers: string[]; fetch: (sb: SB) => Promise<SheetRow[]> }
> = {
  pesanan: {
    headers: ["No. Pesanan", "Tanggal", "Pelanggan", "Channel", "Status", "Subtotal", "Diskon", "Ongkir", "Pajak", "Total", "Status Bayar"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("orders")
        .select("order_no, order_date, channel, status, subtotal, discount, shipping, tax, total, payment_status, contact_name, customer:customers(name)")
        .order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((o: any) => ({
        "No. Pesanan": o.order_no ?? "",
        Tanggal: o.order_date ?? "",
        Pelanggan: g(o, "customer", "name") ?? o.contact_name ?? "Umum",
        Channel: CHANNEL_LABEL[o.channel] ?? o.channel,
        Status: STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status,
        Subtotal: Number(o.subtotal),
        Diskon: Number(o.discount),
        Ongkir: Number(o.shipping),
        Pajak: Number(o.tax),
        Total: Number(o.total),
        "Status Bayar": PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status,
      }));
    },
  },
  pembayaran: {
    headers: ["Tanggal", "No. Pesanan", "Pelanggan", "Jumlah", "Metode", "Referensi"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("payments")
        .select("paid_at, amount, method, reference, order:orders(order_no, contact_name, customer:customers(name))")
        .order("paid_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        Tanggal: p.paid_at ? String(p.paid_at).slice(0, 10) : "",
        "No. Pesanan": g(p, "order", "order_no") ?? "",
        Pelanggan: g(p, "order", "customer", "name") ?? g(p, "order", "contact_name") ?? "Umum",
        Jumlah: Number(p.amount),
        Metode: METHOD_LABEL[p.method] ?? p.method,
        Referensi: p.reference ?? "",
      }));
    },
  },
  pembelian: {
    headers: ["No. Pembelian", "Tanggal", "Pemasok", "Total", "Catatan"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("purchases")
        .select("purchase_no, purchase_date, supplier_name, total, notes")
        .order("created_at", { ascending: false });
      return (data ?? []).map((p) => ({
        "No. Pembelian": p.purchase_no ?? "",
        Tanggal: p.purchase_date ?? "",
        Pemasok: p.supplier_name ?? "",
        Total: Number(p.total),
        Catatan: p.notes ?? "",
      }));
    },
  },
  produksi: {
    headers: ["No. Batch", "Tanggal", "Produk", "Jumlah Batch", "Hasil", "HPP Total", "HPP/unit"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("production_batches")
        .select("batch_no, produced_at, batch_count, produced_qty, hpp_total, hpp_per_unit, product:products(name)")
        .order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((b: any) => ({
        "No. Batch": b.batch_no ?? "",
        Tanggal: b.produced_at ?? "",
        Produk: g(b, "product", "name") ?? "",
        "Jumlah Batch": Number(b.batch_count),
        Hasil: Number(b.produced_qty),
        "HPP Total": Number(b.hpp_total),
        "HPP/unit": Number(b.hpp_per_unit),
      }));
    },
  },
  invoice: {
    headers: ["No. Invoice", "Tanggal", "Jatuh Tempo", "Pelanggan", "Total", "Status"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("invoices")
        .select("invoice_no, issue_date, due_date, total, status, customer:customers(name), order:orders(contact_name)")
        .order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((v: any) => ({
        "No. Invoice": v.invoice_no ?? "",
        Tanggal: v.issue_date ?? "",
        "Jatuh Tempo": v.due_date ?? "",
        Pelanggan: g(v, "customer", "name") ?? g(v, "order", "contact_name") ?? "Umum",
        Total: Number(v.total),
        Status: v.status,
      }));
    },
  },
  pengeluaran: {
    headers: ["Tanggal", "Kategori", "Keterangan", "Jumlah", "Reimbursement", "Untuk", "Status Reimburse", "Foto"],
    fetch: async (sb) => {
      const { data } = await sb
        .from("expenses")
        .select("expense_date, category, description, amount, is_reimbursement, reimburse_to, reimburse_status, photo_url")
        .order("expense_date", { ascending: false });
      return (data ?? []).map((e) => ({
        Tanggal: e.expense_date ?? "",
        Kategori: e.category ?? "",
        Keterangan: e.description ?? "",
        Jumlah: Number(e.amount),
        Reimbursement: e.is_reimbursement ? "Ya" : "Tidak",
        Untuk: e.reimburse_to ?? "",
        "Status Reimburse": e.reimburse_status ?? "",
        Foto: e.photo_url ?? "",
      }));
    },
  },
};

export const SYNC_TABS = [
  ...Object.keys(TWOWAY),
  ...Object.keys(PUSH),
] as const;
export type SyncType = (typeof SYNC_TABS)[number];

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
}
function ts(v: unknown): number {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : 0;
}

async function runTwoway(type: keyof typeof TWOWAY, supabase: SB): Promise<SyncResult> {
  const cfg = TWOWAY[type];
  const headers = [...cfg.fields.map((f) => f.header), "updated_at"];

  const sheetToDb = (row: SheetRow): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const f of cfg.fields) {
      const raw = row[f.header];
      if (f.kind === "number") out[f.field] = num(raw);
      else if (f.kind === "bool") out[f.field] = /^(ya|true|1|aktif)$/i.test(String(raw ?? ""));
      else out[f.field] = String(raw ?? "").trim() || null;
    }
    return out;
  };
  const dbToSheet = (row: Record<string, unknown>): SheetRow => {
    const out: SheetRow = {};
    for (const f of cfg.fields) {
      const v = row[f.field];
      if (f.kind === "bool") out[f.header] = v ? "Ya" : "Tidak";
      else out[f.header] = v === null || v === undefined ? "" : (v as string | number);
    }
    out["updated_at"] = String(row.updated_at ?? "");
    return out;
  };
  const keyOf = (obj: Record<string, unknown>): string => {
    if (cfg.key === "sku") {
      const sku = String(obj.sku ?? "").trim();
      if (sku) return "sku:" + sku.toLowerCase();
    }
    return "name:" + String(obj.name ?? "").trim().toLowerCase();
  };

  let sheetRows: SheetRow[];
  try {
    sheetRows = await sheetGet(type);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { data: dbData } = await supabase.from(cfg.table).select("*");
  const dbRows = dbData ?? [];
  const dbByKey = new Map<string, Record<string, unknown>>();
  for (const r of dbRows) dbByKey.set(keyOf(r), r);

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown> }[] = [];
  for (const sh of sheetRows) {
    const mapped = sheetToDb(sh);
    if (!mapped.name) continue;
    const db = dbByKey.get(keyOf(mapped));
    if (!db) inserts.push(mapped);
    else if (ts(sh["updated_at"]) > ts(db.updated_at)) updates.push({ id: String(db.id), row: mapped });
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

  const { data: fresh } = await supabase.from(cfg.table).select("*").order("name");
  const outRows = (fresh ?? []).map(dbToSheet);
  try {
    await sheetReplace(type, headers, outRows);
  } catch (e) {
    return { ok: false, error: "Berhasil tarik, gagal dorong: " + (e as Error).message };
  }

  revalidatePath(`/${type}`);
  return { ok: true, pulled: inserts.length + updates.length, pushed: outRows.length };
}

async function runPush(type: string, supabase: SB): Promise<SyncResult> {
  const cfg = PUSH[type];
  let rows: SheetRow[];
  try {
    rows = await cfg.fetch(supabase);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  try {
    await sheetReplace(type, cfg.headers, rows);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  return { ok: true, pushed: rows.length };
}

export async function syncSheet(type: SyncType): Promise<SyncResult> {
  if (!sheetConfigured()) {
    return { ok: false, error: "Google Sheets belum dihubungkan." };
  }
  const supabase = await createClient();
  if (type in TWOWAY) return runTwoway(type as keyof typeof TWOWAY, supabase);
  if (type in PUSH) return runPush(type, supabase);
  return { ok: false, error: "Tipe tidak dikenal." };
}

export async function syncAll(): Promise<{ ok: boolean; done: number; failed: string[] }> {
  if (!sheetConfigured()) return { ok: false, done: 0, failed: ["not-configured"] };
  const supabase = await createClient();
  let done = 0;
  const failed: string[] = [];
  for (const t of Object.keys(TWOWAY)) {
    const r = await runTwoway(t as keyof typeof TWOWAY, supabase);
    if (r.ok) done++;
    else failed.push(t);
  }
  for (const t of Object.keys(PUSH)) {
    const r = await runPush(t, supabase);
    if (r.ok) done++;
    else failed.push(t);
  }
  return { ok: failed.length === 0, done, failed };
}
