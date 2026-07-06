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
//   /api/dokumen/[orderId]?jenis=penawaran    → PENAWARAN (quotation)
//   /api/dokumen/[orderId]?jenis=sales-order  → SALES ORDER (konfirmasi)
// Invoice tetap lewat /api/invoice/[invoiceId].
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const jenisParam = req.nextUrl.searchParams.get("jenis") ?? "penawaran";
  const docType: SalesDocType =
    jenisParam === "sales-order" ? "sales_order" : "penawaran";

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

  const prefix = docType === "penawaran" ? "PEN" : "SO";
  const docNo = `${prefix}/${o.order_no ?? "-"}`;

  const data: InvoicePdfData = {
    doc_type: docType,
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
      subtotal: Number(o.subtotal ?? 0),
      discount: Number(o.discount ?? 0),
      shipping: Number(o.shipping ?? 0),
      tax: Number(o.tax ?? 0),
      total: Number(o.total ?? 0),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.order_items ?? []).map((it: any) => ({
      name: it.name ?? "-",
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
      subtotal: Number(it.subtotal),
    })),
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
