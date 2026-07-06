import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  InvoiceDocument,
  type InvoicePdfData,
  type SalesDocType,
} from "@/lib/invoice-pdf";
import { PAYMENT_STATUS_LABEL } from "@/app/(app)/pesanan/labels";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dokumen penjualan per status pesanan (review 2026-07-06):
//   GET  /api/dokumen/[orderId]?jenis=penawaran|sales-order  → apa adanya pesanan
//   POST /api/dokumen/[orderId]  body { jenis, items, promo_note, down_payment }
//        → generator kustom (harga/qty/produk bisa diubah per dokumen)
// Invoice resmi tetap lewat /api/invoice/[invoiceId].

type CustomPayload = {
  jenis?: string;
  items?: { name?: string; qty?: number; unit_price?: number }[];
  promo_note?: string;
  down_payment?: number;
};

function toDocType(jenis: string | null | undefined): SalesDocType {
  if (jenis === "sales-order" || jenis === "sales_order") return "sales_order";
  if (jenis === "invoice") return "invoice";
  return "penawaran";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  let payload: CustomPayload = {};
  try {
    payload = await req.json();
  } catch {
    /* body kosong → pakai data pesanan apa adanya */
  }
  return buildDocument(ctx, toDocType(payload.jenis), payload);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return buildDocument(ctx, toDocType(req.nextUrl.searchParams.get("jenis")), {});
}

async function buildDocument(
  { params }: { params: Promise<{ id: string }> },
  docType: SalesDocType,
  payload: CustomPayload,
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_no, order_date, subtotal, discount, shipping, tax, total, payment_status, contact_name, contact_phone, order_items(name, qty, unit_price, subtotal), customer:customers(name, business_name, address, phone_wa)",
    )
    .eq("id", id)
    .single();

  if (!order) return new NextResponse("Pesanan tidak ditemukan", { status: 404 });

  const { data: business } = await supabase
    .from("business_settings")
    .select(
      "business_name, address, phone_wa, email, instagram, bank_name, bank_account_no, bank_account_name, invoice_notes",
    )
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any;
  let customer = o.customer ?? null;
  if (!customer && (o.contact_name || o.contact_phone)) {
    customer = {
      name: o.contact_name || "Pelanggan Umum",
      business_name: null,
      address: null,
      phone_wa: o.contact_phone || null,
    };
  }

  // Item bisa di-override dari generator (produk/qty/harga per dokumen);
  // subtotal & total dihitung ulang, diskon/ongkir/pajak ikut pesanan.
  const customItems = (payload.items ?? [])
    .map((it) => ({
      name: String(it.name ?? "").trim() || "-",
      qty: Number(it.qty ?? 0),
      unit_price: Number(it.unit_price ?? 0),
    }))
    .filter((it) => it.qty > 0);
  const useCustom = customItems.length > 0;

  const baseItems = useCustom
    ? customItems.map((it) => ({ ...it, subtotal: it.qty * it.unit_price }))
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o.order_items ?? []).map((it: any) => ({
        name: it.name ?? "-",
        qty: Number(it.qty),
        unit_price: Number(it.unit_price),
        subtotal: Number(it.subtotal),
      }));

  const subtotal = useCustom
    ? baseItems.reduce((s: number, it: { subtotal: number }) => s + it.subtotal, 0)
    : Number(o.subtotal ?? 0);
  const discount = Number(o.discount ?? 0);
  const shipping = Number(o.shipping ?? 0);
  const tax = Number(o.tax ?? 0);
  const total = useCustom
    ? Math.max(0, subtotal - discount + shipping + tax)
    : Number(o.total ?? 0);

  const prefix =
    docType === "penawaran" ? "PEN" : docType === "sales_order" ? "SO" : "INV";
  const docNo = `${prefix}/${o.order_no ?? "-"}`;

  const data: InvoicePdfData = {
    doc_type: docType,
    promo_note: (payload.promo_note ?? "").trim() || null,
    down_payment: Math.max(0, Number(payload.down_payment ?? 0)),
    business: {
      business_name: business?.business_name ?? "SAVO",
      address: business?.address,
      phone_wa: business?.phone_wa,
      email: business?.email,
      instagram: business?.instagram,
      bank_name: business?.bank_name,
      bank_account_no: business?.bank_account_no,
      bank_account_name: business?.bank_account_name,
      invoice_notes: business?.invoice_notes,
    },
    invoice: {
      invoice_no: docNo,
      issue_date: o.order_date ?? formatDate(new Date(), "yyyy-MM-dd"),
      due_date: null,
      payment_status_label: PAYMENT_STATUS_LABEL[o.payment_status] ?? "Belum bayar",
    },
    customer,
    order: {
      order_no: o.order_no,
      subtotal,
      discount,
      shipping,
      tax,
      total,
    },
    items: baseItems,
  };

  const element = createElement(InvoiceDocument, {
    data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  const fileName = `${docNo.replace(/\//g, "-")}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
