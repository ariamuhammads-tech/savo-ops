// Shared import column config — used by the client (template + preview + parse)
// and the server (coerce + upsert). Headers are Indonesian and match export.

export type FieldType = "text" | "number" | "bool" | "enum";

export type ImportField = {
  header: string;
  field: string;
  type: FieldType;
  required?: boolean;
  enum?: string[];
};

export type ImportType = "produk" | "bahan" | "pelanggan";

export const IMPORT_CONFIG: Record<
  ImportType,
  { table: string; matchBy: "sku" | "name"; label: string; fields: ImportField[] }
> = {
  produk: {
    table: "products",
    matchBy: "sku",
    label: "Produk",
    fields: [
      { header: "SKU", field: "sku", type: "text" },
      { header: "Nama", field: "name", type: "text", required: true },
      { header: "Kategori", field: "category", type: "text" },
      { header: "Satuan", field: "unit", type: "text" },
      { header: "Berat (g)", field: "weight_grams", type: "number" },
      { header: "Harga B2C", field: "price_b2c", type: "number" },
      { header: "Harga B2B", field: "price_b2b", type: "number" },
      { header: "Stok", field: "stock_qty", type: "number" },
      { header: "Stok Min", field: "min_stock", type: "number" },
      { header: "Aktif", field: "is_active", type: "bool" },
      { header: "Catatan", field: "notes", type: "text" },
    ],
  },
  bahan: {
    table: "ingredients",
    matchBy: "name",
    label: "Bahan Baku",
    fields: [
      { header: "Nama", field: "name", type: "text", required: true },
      { header: "Satuan", field: "unit", type: "text" },
      { header: "Stok", field: "stock_qty", type: "number" },
      { header: "Stok Min", field: "min_stock", type: "number" },
      { header: "Harga Beli Terakhir", field: "last_unit_cost", type: "number" },
      { header: "Pemasok", field: "supplier_name", type: "text" },
      { header: "Catatan", field: "notes", type: "text" },
    ],
  },
  pelanggan: {
    table: "customers",
    matchBy: "name",
    label: "Pelanggan",
    fields: [
      { header: "Nama", field: "name", type: "text", required: true },
      { header: "Tipe", field: "type", type: "enum", enum: ["b2c", "b2b"] },
      { header: "Nama Bisnis", field: "business_name", type: "text" },
      { header: "No. WhatsApp", field: "phone_wa", type: "text" },
      { header: "Email", field: "email", type: "text" },
      { header: "Alamat", field: "address", type: "text" },
      { header: "Tier Harga", field: "price_tier", type: "enum", enum: ["b2c", "b2b"] },
      { header: "Termin (hari)", field: "payment_terms_days", type: "number" },
      { header: "Catatan", field: "notes", type: "text" },
    ],
  },
};

/** Coerce a raw cell value to the field type. Returns { value, error }. */
export function coerceCell(
  f: ImportField,
  raw: unknown,
): { value: unknown; error?: string } {
  const s = raw === null || raw === undefined ? "" : String(raw).trim();
  if (!s) {
    if (f.required) return { value: null, error: `${f.header} wajib diisi` };
    if (f.type === "number") return { value: 0 };
    if (f.type === "bool") return { value: f.field === "is_active" ? true : false };
    return { value: null };
  }
  switch (f.type) {
    case "number": {
      const n = Number(s.replace(/\./g, "").replace(/,/g, "."));
      if (!Number.isFinite(n)) return { value: 0, error: `${f.header} bukan angka` };
      return { value: n };
    }
    case "bool":
      return { value: /^(ya|true|1|aktif|y)$/i.test(s) };
    case "enum": {
      const v = s.toLowerCase();
      if (f.enum && !f.enum.includes(v))
        return { value: f.enum[0], error: `${f.header} harus ${f.enum.join("/")}` };
      return { value: v };
    }
    default:
      return { value: s };
  }
}
