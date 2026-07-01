import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { InvoiceDocument, type InvoicePdfData } from "@/lib/invoice-pdf";
import { PAYMENT_STATUS_LABEL } from "@/app/(app)/pesanan/labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invoices")
    .select(
      "invoice_no, issue_date, due_date, order:orders(order_no, subtotal, discount, shipping, tax, total, payment_status, order_items(name, qty, unit_price, subtotal)), customer:customers(name, business_name, address, phone_wa)",
    )
    .eq("id", id)
    .single();

  if (!inv) {
    return new NextResponse("Invoice tidak ditemukan", { status: 404 });
  }

  const { data: business } = await supabase
    .from("business_settings")
    .select(
      "business_name, address, phone_wa, email, instagram, bank_name, bank_account_no, bank_account_name, invoice_notes",
    )
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = (inv as any).order ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (inv as any).customer ?? null;

  const data: InvoicePdfData = {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoice_no: (inv as any).invoice_no ?? "-",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      issue_date: (inv as any).issue_date,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      due_date: (inv as any).due_date,
      payment_status_label:
        PAYMENT_STATUS_LABEL[order.payment_status] ?? "Belum bayar",
    },
    customer,
    order: {
      order_no: order.order_no,
      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discount ?? 0),
      shipping: Number(order.shipping ?? 0),
      tax: Number(order.tax ?? 0),
      total: Number(order.total ?? 0),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (order.order_items ?? []).map((it: any) => ({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileName = `${(inv as any).invoice_no ?? "invoice"}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
