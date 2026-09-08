import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { InvoiceDocument, type InvoicePdfData } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as InvoicePdfData;

    if (!data || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Data invoice atau item produk tidak valid." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(InvoiceDocument, { data }) as any);

    const filename = `Invoice-${data.invoice.invoice_no || "SAVO"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal merender PDF Invoice.";
    console.error("[Invoice Render Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
