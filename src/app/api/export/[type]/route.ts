import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, PAYMENT_STATUS_LABEL, CHANNEL_LABEL, METHOD_LABEL } from "@/app/(app)/pesanan/labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Col = { header: string; key: string; width?: number; money?: boolean };

const MONEY_FMT = '"Rp"#,##0';

async function buildRows(
  type: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ sheet: string; cols: Col[]; rows: Record<string, unknown>[] } | null> {
  switch (type) {
    case "produk": {
      const { data } = await supabase.from("products").select("*").order("name");
      return {
        sheet: "Produk",
        cols: [
          { header: "SKU", key: "sku", width: 14 },
          { header: "Nama", key: "name", width: 26 },
          { header: "Kategori", key: "category", width: 16 },
          { header: "Satuan", key: "unit", width: 10 },
          { header: "Berat (g)", key: "weight_grams", width: 10 },
          { header: "Harga B2C", key: "price_b2c", width: 14, money: true },
          { header: "Harga B2B", key: "price_b2b", width: 14, money: true },
          { header: "Stok", key: "stock_qty", width: 10 },
          { header: "Stok Min", key: "min_stock", width: 10 },
          { header: "Aktif", key: "is_active", width: 8 },
          { header: "Catatan", key: "notes", width: 24 },
        ],
        rows: (data ?? []).map((p) => ({ ...p, is_active: p.is_active ? "Ya" : "Tidak" })),
      };
    }
    case "bahan": {
      const { data } = await supabase.from("ingredients").select("*").order("name");
      return {
        sheet: "Bahan Baku",
        cols: [
          { header: "Nama", key: "name", width: 28 },
          { header: "Satuan", key: "unit", width: 10 },
          { header: "Stok", key: "stock_qty", width: 12 },
          { header: "Stok Min", key: "min_stock", width: 12 },
          { header: "Harga Beli Terakhir", key: "last_unit_cost", width: 18, money: true },
          { header: "Pemasok", key: "supplier_name", width: 22 },
          { header: "Catatan", key: "notes", width: 24 },
        ],
        rows: data ?? [],
      };
    }
    case "pelanggan": {
      const { data } = await supabase.from("customers").select("*").order("name");
      return {
        sheet: "Pelanggan",
        cols: [
          { header: "Nama", key: "name", width: 24 },
          { header: "Tipe", key: "type", width: 8 },
          { header: "Nama Bisnis", key: "business_name", width: 24 },
          { header: "No. WhatsApp", key: "phone_wa", width: 16 },
          { header: "Email", key: "email", width: 22 },
          { header: "Alamat", key: "address", width: 30 },
          { header: "Tier Harga", key: "price_tier", width: 10 },
          { header: "Termin (hari)", key: "payment_terms_days", width: 12 },
          { header: "Catatan", key: "notes", width: 24 },
        ],
        rows: data ?? [],
      };
    }
    case "pesanan": {
      const { data } = await supabase
        .from("orders")
        .select("order_no, order_date, channel, status, subtotal, discount, shipping, tax, total, payment_status, contact_name, customer:customers(name)")
        .order("created_at", { ascending: false });
      return {
        sheet: "Pesanan",
        cols: [
          { header: "No. Pesanan", key: "order_no", width: 16 },
          { header: "Tanggal", key: "order_date", width: 12 },
          { header: "Pelanggan", key: "pelanggan", width: 24 },
          { header: "Channel", key: "channel", width: 12 },
          { header: "Status", key: "status", width: 14 },
          { header: "Subtotal", key: "subtotal", width: 14, money: true },
          { header: "Diskon", key: "discount", width: 12, money: true },
          { header: "Ongkir", key: "shipping", width: 12, money: true },
          { header: "Pajak", key: "tax", width: 12, money: true },
          { header: "Total", key: "total", width: 14, money: true },
          { header: "Status Bayar", key: "payment_status", width: 14 },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows: (data ?? []).map((o: any) => ({
          ...o,
          pelanggan: o.customer?.name ?? o.contact_name ?? "Umum",
          channel: CHANNEL_LABEL[o.channel] ?? o.channel,
          status: STATUS_LABEL[o.status as keyof typeof STATUS_LABEL] ?? o.status,
          payment_status: PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status,
        })),
      };
    }
    case "pembayaran": {
      const { data } = await supabase
        .from("payments")
        .select("paid_at, amount, method, reference, order:orders(order_no, customer:customers(name), contact_name)")
        .order("paid_at", { ascending: false });
      return {
        sheet: "Pembayaran",
        cols: [
          { header: "Tanggal", key: "paid_at", width: 14 },
          { header: "No. Pesanan", key: "order_no", width: 16 },
          { header: "Pelanggan", key: "pelanggan", width: 24 },
          { header: "Jumlah", key: "amount", width: 14, money: true },
          { header: "Metode", key: "method", width: 12 },
          { header: "Referensi", key: "reference", width: 20 },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows: (data ?? []).map((p: any) => ({
          paid_at: p.paid_at ? String(p.paid_at).slice(0, 10) : "",
          order_no: p.order?.order_no ?? "",
          pelanggan: p.order?.customer?.name ?? p.order?.contact_name ?? "Umum",
          amount: p.amount,
          method: METHOD_LABEL[p.method] ?? p.method,
          reference: p.reference,
        })),
      };
    }
    default:
      return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const supabase = await createClient();
  const built = await buildRows(type, supabase);
  if (!built) return new NextResponse("Tipe tidak dikenal", { status: 404 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "SAVO Ops";
  const ws = wb.addWorksheet(built.sheet);

  ws.columns = built.cols.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));

  // Header styling
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFBF7F0" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0492B" } };
  header.alignment = { vertical: "middle" };
  header.height = 20;

  built.rows.forEach((r) => ws.addRow(r));

  // Money formatting
  built.cols.forEach((c, i) => {
    if (c.money) ws.getColumn(i + 1).numFmt = MONEY_FMT;
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `savo-${type}-${stamp}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
