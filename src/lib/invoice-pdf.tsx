import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import { formatIDR, formatDate } from "@/lib/format";

/** Jenis dokumen penjualan — satu layout untuk tiga status (review 2026-07-06). */
export type SalesDocType = "invoice" | "penawaran" | "sales_order";

export const DOC_TITLE: Record<SalesDocType, string> = {
  invoice: "INVOICE",
  penawaran: "PENAWARAN",
  sales_order: "SALES ORDER",
};

export type InvoicePdfData = {
  /** default: "invoice" */
  doc_type?: SalesDocType;
  /** Keterangan promo — tercetak di bawah total (review 2026-07-06). */
  promo_note?: string | null;
  /** Down payment (Rp) — tercetak beserta sisa tagihan. */
  down_payment?: number;
  business: {
    business_name: string;
    address?: string | null;
    phone_wa?: string | null;
    email?: string | null;
    instagram?: string | null;
    bank_name?: string | null;
    bank_account_no?: string | null;
    bank_account_name?: string | null;
    invoice_notes?: string | null;
  };
  invoice: {
    invoice_no: string;
    issue_date: string;
    due_date?: string | null;
    payment_status_label: string;
  };
  customer?: {
    name: string;
    business_name?: string | null;
    address?: string | null;
    phone_wa?: string | null;
  } | null;
  order: {
    order_no?: string | null;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  items: { name: string; qty: number; unit_price: number; subtotal: number }[];
};

const INK = "#241E19";
const MUTED = "#7A6E62";
const ACCENT = "#C0492B";
const ACCENT_INK = "#8A2F1A";
const BORDER = "#E7DDCC";
const CREAM = "#FBF6EE";
const CREAM_2 = "#F3E9D9";
const ZEBRA = "#FBF8F3";
const GREEN = "#2F7D5B";
const AMBER = "#B77A22";

const PAD = 34;

// Editorial "Claude" redesign (2026-07-06): warm cream header band, serif
// display type, status pill, zebra table, and a filled amount-due box.
// Semua data & percabangan dipertahankan — hanya tampilan yang berubah.
const s = StyleSheet.create({
  page: { paddingBottom: PAD, fontSize: 11, lineHeight: 1.4, color: INK, fontFamily: "Helvetica" },
  accentBar: { height: 6, backgroundColor: ACCENT },

  header: {
    backgroundColor: CREAM,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: PAD,
    paddingTop: 22,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { fontSize: 26, fontFamily: "Times-Bold", color: ACCENT, marginLeft: 8, letterSpacing: 1 },
  biz: { fontSize: 9.5, color: MUTED, marginTop: 6, maxWidth: 230, lineHeight: 1.5 },

  docTitle: { fontSize: 26, fontFamily: "Times-Bold", color: INK, textAlign: "right", letterSpacing: 1 },
  invMeta: { fontSize: 10, color: MUTED, textAlign: "right", marginTop: 3 },
  invMetaStrong: { fontSize: 10.5, color: INK, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 3 },
  pillWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 7 },
  pill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, fontSize: 9, fontFamily: "Helvetica-Bold" },

  body: { paddingHorizontal: PAD, paddingTop: 22 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", gap: 20 },
  label: { fontSize: 8.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  partyName: { fontSize: 13, fontFamily: "Times-Bold" },
  strong: { fontFamily: "Helvetica-Bold" },
  soft: { color: MUTED },

  tableHead: {
    flexDirection: "row",
    backgroundColor: CREAM_2,
    paddingVertical: 8,
    paddingHorizontal: 9,
    marginTop: 20,
    borderRadius: 4,
  },
  headText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: ACCENT_INK, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 9, borderBottomWidth: 1, borderBottomColor: BORDER },
  rowAlt: { backgroundColor: ZEBRA },
  cName: { flex: 4 },
  cQty: { flex: 1.2, textAlign: "right" },
  cPrice: { flex: 2, textAlign: "right" },
  cSub: { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold" },

  totals: { marginTop: 16, alignSelf: "flex-end", width: 268 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5 },
  totalTop: { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4, paddingTop: 7 },
  totalBold: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  dueBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  dueLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFF3EE", letterSpacing: 0.5 },
  dueValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

  panel: { backgroundColor: CREAM, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 13, marginTop: 14 },
  note: { fontSize: 9.5, color: MUTED, marginTop: 12, lineHeight: 1.5 },
  thanks: { fontSize: 10.5, fontFamily: "Times-Italic", color: INK, marginTop: 16 },
});

function statusPillStyle(label: string) {
  const l = label.toLowerCase();
  if (l.includes("lunas")) return { backgroundColor: "#E6F1EB", color: GREEN };
  if (l.includes("sebagian") || l.includes("partial"))
    return { backgroundColor: "#FBF1DF", color: AMBER };
  return { backgroundColor: "#F7E7E2", color: ACCENT };
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { business, invoice, customer, order, items } = data;
  const docType: SalesDocType = data.doc_type ?? "invoice";
  const dp = Number(data.down_payment ?? 0);
  const hasDp = dp > 0;
  const dueLabel = hasDp ? "SISA TAGIHAN" : docType === "invoice" ? "TOTAL TAGIHAN" : "TOTAL";
  const dueValue = hasDp ? Math.max(0, order.total - dp) : order.total;
  const pill = statusPillStyle(invoice.payment_status_label);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />

        {/* ===== Header band ===== */}
        <View style={s.header}>
          <View>
            <View style={s.brandRow}>
              <Svg viewBox="0 0 224 206.2" width={28} height={26}>
                <Path
                  d="M29.93 180.44l-29.93 25.76 150.1 0c13.34,0 36.8,-3.12 36.99,-25.09l-157.17 -0.67z"
                  fill={ACCENT}
                />
                <Path
                  d="M65.54 129.86c81.55,-24.22 143.09,-40.82 154.84,0.2 3.65,12.74 -5.09,30.08 -33.29,51.06 88.31,-10.67 106.34,-170.79 7.81,-133.89 -68.58,23.9 -138.3,39.56 -139.75,7.04 -0.58,-12.99 5.33,-20.37 20.2,-29.17 -88.31,10.67 -103.96,129.99 -9.82,104.77z"
                  fill={ACCENT}
                />
                <Path
                  d="M191.28 25.76l28.38 -24.43 -107.32 -1.33c-16.44,0 -36.8,3.12 -36.99,25.09l115.93 0.67z"
                  fill={ACCENT}
                />
              </Svg>
              <Text style={s.brand}>{business.business_name || "SAVO"}</Text>
            </View>
            <Text style={s.biz}>
              {[business.address, business.phone_wa, business.instagram, business.email]
                .filter(Boolean)
                .join("  •  ")}
            </Text>
          </View>
          <View>
            <Text style={s.docTitle}>{DOC_TITLE[docType]}</Text>
            <Text style={s.invMetaStrong}>{invoice.invoice_no}</Text>
            <Text style={s.invMeta}>Tanggal: {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date ? (
              <Text style={s.invMeta}>
                {docType === "penawaran" ? "Berlaku s.d." : "Jatuh tempo"}:{" "}
                {formatDate(invoice.due_date)}
              </Text>
            ) : null}
            {docType === "invoice" ? (
              <View style={s.pillWrap}>
                <Text style={[s.pill, { backgroundColor: pill.backgroundColor, color: pill.color }]}>
                  {invoice.payment_status_label.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ===== Body ===== */}
        <View style={s.body}>
          <View style={s.twoCol}>
            <View style={{ maxWidth: 280 }}>
              <Text style={s.label}>
                {docType === "invoice" ? "Ditagihkan kepada" : "Kepada"}
              </Text>
              <Text style={s.partyName}>{customer?.name ?? "Pelanggan Umum"}</Text>
              {customer?.business_name ? <Text>{customer.business_name}</Text> : null}
              {customer?.address ? <Text style={s.soft}>{customer.address}</Text> : null}
              {customer?.phone_wa ? <Text style={s.soft}>WA: {customer.phone_wa}</Text> : null}
            </View>
            {order.order_no ? (
              <View>
                <Text style={[s.label, { textAlign: "right" }]}>No. Pesanan</Text>
                <Text style={[s.strong, { textAlign: "right" }]}>{order.order_no}</Text>
              </View>
            ) : null}
          </View>

          {/* Items */}
          <View style={s.tableHead}>
            <Text style={[s.cName, s.headText]}>Produk</Text>
            <Text style={[s.cQty, s.headText]}>Qty</Text>
            <Text style={[s.cPrice, s.headText]}>Harga</Text>
            <Text style={[s.cSub, s.headText]}>Subtotal</Text>
          </View>
          {items.map((it, i) => (
            <View style={i % 2 === 1 ? [s.row, s.rowAlt] : s.row} key={i} wrap={false}>
              <Text style={s.cName}>{it.name}</Text>
              <Text style={s.cQty}>{it.qty}</Text>
              <Text style={s.cPrice}>{formatIDR(it.unit_price)}</Text>
              <Text style={s.cSub}>{formatIDR(it.subtotal)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text style={s.soft}>Subtotal</Text>
              <Text>{formatIDR(order.subtotal)}</Text>
            </View>
            {order.discount > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.soft}>Diskon</Text>
                <Text>- {formatIDR(order.discount)}</Text>
              </View>
            ) : null}
            {order.shipping > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.soft}>Ongkir</Text>
                <Text>{formatIDR(order.shipping)}</Text>
              </View>
            ) : null}
            {order.tax > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.soft}>Pajak</Text>
                <Text>{formatIDR(order.tax)}</Text>
              </View>
            ) : null}
            <View style={[s.totalRow, s.totalTop]}>
              <Text style={s.totalBold}>Total</Text>
              <Text style={s.totalBold}>{formatIDR(order.total)}</Text>
            </View>
            {hasDp ? (
              <View style={s.totalRow}>
                <Text style={s.soft}>Down Payment (DP)</Text>
                <Text>- {formatIDR(dp)}</Text>
              </View>
            ) : null}
            <View style={s.dueBox}>
              <Text style={s.dueLabel}>{dueLabel}</Text>
              <Text style={s.dueValue}>{formatIDR(dueValue)}</Text>
            </View>
          </View>

          {/* Promo / keterangan */}
          {data.promo_note ? (
            <View style={s.panel}>
              <Text style={s.label}>Keterangan</Text>
              <Text>{data.promo_note}</Text>
            </View>
          ) : null}

          {/* Footer notes + bank */}
          {docType === "penawaran" ? (
            <Text style={s.note}>
              Dokumen ini adalah penawaran harga — bukan tagihan. Harga &amp;
              ketersediaan berlaku sampai tanggal di atas (bila diisi) atau maksimal
              14 hari.
            </Text>
          ) : null}
          {docType === "sales_order" ? (
            <Text style={s.note}>
              Sales Order ini adalah konfirmasi pesanan beserta finalisasi harga,
              diskon, dan ketentuan transaksi. Invoice diterbitkan terpisah untuk
              penagihan.
            </Text>
          ) : null}
          {business.bank_name || business.bank_account_no ? (
            <View style={s.panel}>
              <Text style={s.label}>Pembayaran transfer ke</Text>
              <Text style={s.strong}>
                {business.bank_name}{" "}
                {business.bank_account_no ? `- ${business.bank_account_no}` : ""}
              </Text>
              {business.bank_account_name ? (
                <Text style={s.soft}>a.n. {business.bank_account_name}</Text>
              ) : null}
            </View>
          ) : null}
          {business.invoice_notes ? <Text style={s.note}>{business.invoice_notes}</Text> : null}
          <Text style={s.thanks}>
            Terima kasih atas kepercayaan Anda. — {business.business_name || "SAVO"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
