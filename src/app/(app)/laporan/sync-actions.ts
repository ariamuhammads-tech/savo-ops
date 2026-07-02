"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sheetGet, sheetReplace, sheetConfigured, type SheetRow } from "@/lib/gsheet";
import {
  STATUS_LABEL,
  CHANNEL_LABEL,
  PAYMENT_STATUS_LABEL,
  METHOD_LABEL,
} from "../pesanan/labels";

export type SyncResult = { ok: boolean; error?: string; pulled?: number; pushed?: number };

type Admin = ReturnType<typeof createAdminClient>;
type Kind = "text" | "number" | "bool";
type Col = { header: string; field?: string; kind?: Kind; ro?: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = (o: any, ...p: string[]) => p.reduce((a, k) => (a ? a[k] : undefined), o);
const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
};
const ts = (v: unknown) => {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : 0;
};

type Entity = {
  table: string;
  allowInsert: boolean;
  requiredField?: string;
  cols: Col[];
  pushFetch: (admin: Admin) => Promise<SheetRow[]>;
};

function masterPush(cols: Col[], table: string) {
  return async (admin: Admin): Promise<SheetRow[]> => {
    const { data } = await admin.from(table as never).select("*");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => {
      const row: SheetRow = {};
      for (const c of cols) {
        const v = r[c.field ?? c.header];
        if (c.kind === "bool") row[c.header] = v ? "Ya" : "Tidak";
        else row[c.header] = v === null || v === undefined ? "" : v;
      }
      row["id"] = r.id;
      row["updated_at"] = String(r.updated_at ?? "");
      return row;
    });
  };
}

const ENTITIES: Record<string, Entity> = {
  produk: {
    table: "products",
    allowInsert: true,
    requiredField: "name",
    cols: [
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
    pushFetch: masterPush(
      [
        { header: "SKU", field: "sku" },
        { header: "Nama", field: "name" },
        { header: "Kategori", field: "category" },
        { header: "Satuan", field: "unit" },
        { header: "Berat (g)", field: "weight_grams", kind: "number" },
        { header: "Harga B2C", field: "price_b2c", kind: "number" },
        { header: "Harga B2B", field: "price_b2b", kind: "number" },
        { header: "Stok", field: "stock_qty", kind: "number" },
        { header: "Stok Min", field: "min_stock", kind: "number" },
        { header: "Aktif", field: "is_active", kind: "bool" },
        { header: "Catatan", field: "notes" },
      ],
      "products",
    ),
  },
  bahan: {
    table: "ingredients",
    allowInsert: true,
    requiredField: "name",
    cols: [
      { header: "Nama", field: "name", kind: "text" },
      { header: "Satuan", field: "unit", kind: "text" },
      { header: "Stok", field: "stock_qty", kind: "number" },
      { header: "Stok Min", field: "min_stock", kind: "number" },
      { header: "Harga Beli Terakhir", field: "last_unit_cost", kind: "number" },
      { header: "Pemasok", field: "supplier_name", kind: "text" },
      { header: "Catatan", field: "notes", kind: "text" },
    ],
    pushFetch: masterPush(
      [
        { header: "Nama", field: "name" },
        { header: "Satuan", field: "unit" },
        { header: "Stok", field: "stock_qty", kind: "number" },
        { header: "Stok Min", field: "min_stock", kind: "number" },
        { header: "Harga Beli Terakhir", field: "last_unit_cost", kind: "number" },
        { header: "Pemasok", field: "supplier_name" },
        { header: "Catatan", field: "notes" },
      ],
      "ingredients",
    ),
  },
  pelanggan: {
    table: "customers",
    allowInsert: true,
    requiredField: "name",
    cols: [
      { header: "Nama", field: "name", kind: "text" },
      { header: "Tipe", field: "type", kind: "text" },
      { header: "Nama Bisnis", field: "business_name", kind: "text" },
      { header: "No. WhatsApp", field: "phone_wa", kind: "text" },
      { header: "Email", field: "email", kind: "text" },
      { header: "Alamat", field: "address", kind: "text" },
      { header: "Tier Harga", field: "price_tier", kind: "text" },
      { header: "Termin (hari)", field: "payment_terms_days", kind: "number" },
      { header: "Catatan", field: "notes", kind: "text" },
    ],
    pushFetch: masterPush(
      [
        { header: "Nama", field: "name" },
        { header: "Tipe", field: "type" },
        { header: "Nama Bisnis", field: "business_name" },
        { header: "No. WhatsApp", field: "phone_wa" },
        { header: "Email", field: "email" },
        { header: "Alamat", field: "address" },
        { header: "Tier Harga", field: "price_tier" },
        { header: "Termin (hari)", field: "payment_terms_days", kind: "number" },
        { header: "Catatan", field: "notes" },
      ],
      "customers",
    ),
  },
  pengeluaran: {
    table: "expenses",
    allowInsert: true,
    requiredField: "description",
    cols: [
      { header: "Tanggal", field: "expense_date", kind: "text" },
      { header: "Kategori", field: "category", kind: "text" },
      { header: "Keterangan", field: "description", kind: "text" },
      { header: "Jumlah", field: "amount", kind: "number" },
      { header: "Reimbursement", field: "is_reimbursement", kind: "bool" },
      { header: "Untuk", field: "reimburse_to", kind: "text" },
      { header: "Status Reimburse", field: "reimburse_status", ro: true },
      { header: "Foto", field: "photo_url", ro: true },
    ],
    pushFetch: masterPush(
      [
        { header: "Tanggal", field: "expense_date" },
        { header: "Kategori", field: "category" },
        { header: "Keterangan", field: "description" },
        { header: "Jumlah", field: "amount", kind: "number" },
        { header: "Reimbursement", field: "is_reimbursement", kind: "bool" },
        { header: "Untuk", field: "reimburse_to" },
        { header: "Status Reimburse", field: "reimburse_status" },
        { header: "Foto", field: "photo_url" },
      ],
      "expenses",
    ),
  },

  // ---- Transactional: two-way but edit-only (no insert from sheet) ----
  pesanan: {
    table: "orders",
    allowInsert: false,
    cols: [
      { header: "No. Pesanan", ro: true },
      { header: "Tanggal", field: "order_date", kind: "text" },
      { header: "Pelanggan", ro: true },
      { header: "Channel", ro: true },
      { header: "Status", ro: true },
      { header: "Subtotal", field: "subtotal", kind: "number" },
      { header: "Diskon", field: "discount", kind: "number" },
      { header: "Ongkir", field: "shipping", kind: "number" },
      { header: "Pajak", field: "tax", kind: "number" },
      { header: "Total", field: "total", kind: "number" },
      { header: "Status Bayar", ro: true },
    ],
    pushFetch: async (admin) => {
      const { data } = await admin
        .from("orders")
        .select("id, updated_at, order_no, order_date, channel, status, subtotal, discount, shipping, tax, total, payment_status, contact_name, customer:customers(name)")
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
        id: o.id,
        updated_at: String(o.updated_at ?? ""),
      }));
    },
  },
  pembayaran: {
    table: "payments",
    allowInsert: false,
    cols: [
      { header: "Tanggal", field: "paid_at", kind: "text" },
      { header: "No. Pesanan", ro: true },
      { header: "Pelanggan", ro: true },
      { header: "Jumlah", field: "amount", kind: "number" },
      { header: "Metode", ro: true },
      { header: "Referensi", field: "reference", kind: "text" },
    ],
    pushFetch: async (admin) => {
      const { data } = await admin
        .from("payments")
        .select("id, updated_at, paid_at, amount, method, reference, order:orders(order_no, contact_name, customer:customers(name))")
        .order("paid_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        Tanggal: p.paid_at ? String(p.paid_at).slice(0, 10) : "",
        "No. Pesanan": g(p, "order", "order_no") ?? "",
        Pelanggan: g(p, "order", "customer", "name") ?? g(p, "order", "contact_name") ?? "Umum",
        Jumlah: Number(p.amount),
        Metode: METHOD_LABEL[p.method] ?? p.method,
        Referensi: p.reference ?? "",
        id: p.id,
        updated_at: String(p.updated_at ?? ""),
      }));
    },
  },
  pembelian: {
    table: "purchases",
    allowInsert: false,
    cols: [
      { header: "No. Pembelian", ro: true },
      { header: "Tanggal", field: "purchase_date", kind: "text" },
      { header: "Pemasok", field: "supplier_name", kind: "text" },
      { header: "Total", field: "total", kind: "number" },
      { header: "Catatan", field: "notes", kind: "text" },
    ],
    pushFetch: masterPush(
      [
        { header: "No. Pembelian", field: "purchase_no" },
        { header: "Tanggal", field: "purchase_date" },
        { header: "Pemasok", field: "supplier_name" },
        { header: "Total", field: "total", kind: "number" },
        { header: "Catatan", field: "notes" },
      ],
      "purchases",
    ),
  },
  produksi: {
    table: "production_batches",
    allowInsert: false,
    cols: [
      { header: "No. Batch", ro: true },
      { header: "Tanggal", field: "produced_at", kind: "text" },
      { header: "Produk", ro: true },
      { header: "Jumlah Batch", field: "batch_count", kind: "number" },
      { header: "Hasil", field: "produced_qty", kind: "number" },
      { header: "HPP Total", field: "hpp_total", kind: "number" },
      { header: "HPP/unit", ro: true },
    ],
    pushFetch: async (admin) => {
      const { data } = await admin
        .from("production_batches")
        .select("id, updated_at, batch_no, produced_at, batch_count, produced_qty, hpp_total, hpp_per_unit, product:products(name)")
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
        id: b.id,
        updated_at: String(b.updated_at ?? ""),
      }));
    },
  },
  invoice: {
    table: "invoices",
    allowInsert: false,
    cols: [
      { header: "No. Invoice", ro: true },
      { header: "Tanggal", field: "issue_date", kind: "text" },
      { header: "Jatuh Tempo", field: "due_date", kind: "text" },
      { header: "Pelanggan", ro: true },
      { header: "Total", field: "total", kind: "number" },
      { header: "Status", ro: true },
    ],
    pushFetch: async (admin) => {
      const { data } = await admin
        .from("invoices")
        .select("id, updated_at, invoice_no, issue_date, due_date, total, status, customer:customers(name), order:orders(contact_name)")
        .order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((v: any) => ({
        "No. Invoice": v.invoice_no ?? "",
        Tanggal: v.issue_date ?? "",
        "Jatuh Tempo": v.due_date ?? "",
        Pelanggan: g(v, "customer", "name") ?? g(v, "order", "contact_name") ?? "Umum",
        Total: Number(v.total),
        Status: v.status,
        id: v.id,
        updated_at: String(v.updated_at ?? ""),
      }));
    },
  },
};

export const SYNC_TABS = Object.keys(ENTITIES) as (keyof typeof ENTITIES)[];
export type SyncType = keyof typeof ENTITIES;

function coerce(c: Col, raw: unknown): unknown {
  if (c.kind === "number") return num(raw);
  if (c.kind === "bool") return /^(ya|true|1|aktif)$/i.test(String(raw ?? ""));
  return String(raw ?? "").trim() || null;
}

async function runEntity(type: SyncType, admin: Admin): Promise<SyncResult> {
  const e = ENTITIES[type];
  const writable = e.cols.filter((c) => c.field && !c.ro);
  const headers = [...e.cols.map((c) => c.header), "id", "updated_at"];

  let sheetRows: SheetRow[];
  try {
    sheetRows = await sheetGet(type);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const { data: dbData } = await admin.from(e.table as never).select("id, updated_at");
  const dbById = new Map<string, { updated_at: unknown }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (dbData ?? []) as any[]) dbById.set(String(r.id), r);

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown> }[] = [];

  for (const sh of sheetRows) {
    const id = String(sh["id"] ?? "").trim();
    const mapped: Record<string, unknown> = {};
    for (const c of writable) mapped[c.field!] = coerce(c, sh[c.header]);

    if (id && dbById.has(id)) {
      const db = dbById.get(id)!;
      if (ts(sh["updated_at"]) > ts(db.updated_at)) updates.push({ id, row: mapped });
    } else if (!id && e.allowInsert) {
      if (e.requiredField && !mapped[e.requiredField]) continue;
      inserts.push(mapped);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = () => admin.from(e.table as never) as any;
  try {
    if (inserts.length) {
      const { error } = await tbl().insert(inserts);
      if (error) throw error;
    }
    for (const u of updates) {
      const { error } = await tbl().update(u.row).eq("id", u.id);
      if (error) throw error;
    }
  } catch (err) {
    return { ok: false, error: "Gagal tulis DB: " + (err as Error).message };
  }

  let outRows: SheetRow[];
  try {
    outRows = await e.pushFetch(admin);
  } catch (err) {
    return { ok: false, error: "Gagal baca DB: " + (err as Error).message };
  }
  try {
    await sheetReplace(type, headers, outRows);
  } catch (err) {
    return { ok: false, error: "Gagal tulis Sheet: " + (err as Error).message };
  }

  revalidatePath(`/${type}`);
  return { ok: true, pulled: inserts.length + updates.length, pushed: outRows.length };
}

export async function syncSheet(type: SyncType): Promise<SyncResult> {
  if (!sheetConfigured()) return { ok: false, error: "Google Sheets belum dihubungkan." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi login tidak ditemukan. Muat ulang halaman." };

  const admin = createAdminClient();
  return runEntity(type, admin);
}
