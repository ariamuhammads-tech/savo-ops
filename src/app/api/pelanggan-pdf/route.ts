import { createElement as h } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INK = "#1F1A17";
const MUTED = "#6B6258";
const ACCENT = "#C0492B";
const BORDER = "#E7DDCC";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9.5, color: INK, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT },
  meta: { fontSize: 8.5, color: MUTED, marginTop: 2, marginBottom: 12 },
  head: {
    flexDirection: "row",
    backgroundColor: "#F1E9DC",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  cName: { width: "26%" },
  cType: { width: "9%" },
  cBiz: { width: "23%" },
  cWa: { width: "20%" },
  cTerm: { width: "10%" },
  cTier: { width: "12%" },
});

// Ekspor PDF daftar pelanggan (review 2026-07-06).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: customers } = await supabase
    .from("customers")
    .select("name, type, business_name, phone_wa, payment_terms_days, price_tier")
    .order("name");

  const rows = customers ?? [];

  const doc = h(
    Document,
    {},
    h(
      Page,
      { size: "A4", style: s.page },
      h(Text, { style: s.title }, "Data Pelanggan — SAVO"),
      h(
        Text,
        { style: s.meta },
        `${rows.length} pelanggan · diekspor ${formatDate(new Date())}`,
      ),
      h(
        View,
        { style: s.head },
        h(Text, { style: [s.cName, s.bold] }, "Nama"),
        h(Text, { style: [s.cType, s.bold] }, "Tipe"),
        h(Text, { style: [s.cBiz, s.bold] }, "Nama Usaha"),
        h(Text, { style: [s.cWa, s.bold] }, "WhatsApp"),
        h(Text, { style: [s.cTerm, s.bold] }, "Termin"),
        h(Text, { style: [s.cTier, s.bold] }, "Tier Harga"),
      ),
      ...rows.map((c, i) =>
        h(
          View,
          { style: s.row, key: String(i), wrap: false },
          h(Text, { style: s.cName }, c.name ?? "-"),
          h(Text, { style: s.cType }, (c.type ?? "-").toUpperCase()),
          h(Text, { style: s.cBiz }, c.business_name ?? "-"),
          h(Text, { style: s.cWa }, c.phone_wa ?? "-"),
          h(
            Text,
            { style: s.cTerm },
            c.payment_terms_days ? `${c.payment_terms_days} hari` : "Tunai",
          ),
          h(Text, { style: s.cTier }, (c.price_tier ?? "b2c").toUpperCase()),
        ),
      ),
    ),
  );

  const buffer = await renderToBuffer(
    doc as unknown as Parameters<typeof renderToBuffer>[0],
  );
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pelanggan-savo.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
