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

// ===== Palette from the "Invoice Mobile" Claude design =====
const PAGE_BG = "#EFE7D9";
const CARD = "#FDFBF7";
const INK = "#1F1A17";
const MUTED = "#6B6258";
const LABEL = "#9A9082";
const ACCENT = "#C0492B";
const BORDER = "#E7DDCC";
const HEADER_MUTED = "#B7AC9C";
const BILLED_BG = "#F6EFE2";
const DIVIDER = "#EFE7D9";
const PAY_BG = "#FBF7F0";
const TOTAL_LABEL = "#F3D2C6";
const WATERMARK = "#FDDCCF";

// SAVO wordmark (S monogram + "SAVO"); the first three paths are the monogram.
const SAVO_PATHS = [
  "M29.93 180.44l-29.93 25.76 150.1 0c13.34,0 36.8,-3.12 36.99,-25.09l-157.17 -0.67z",
  "M65.54 129.86c81.55,-24.22 143.09,-40.82 154.84,0.2 3.65,12.74 -5.09,30.08 -33.29,51.06 88.31,-10.67 106.34,-170.79 7.81,-133.89 -68.58,23.9 -138.3,39.56 -139.75,7.04 -0.58,-12.99 5.33,-20.37 20.2,-29.17 -88.31,10.67 -103.96,129.99 -9.82,104.77z",
  "M191.28 25.76l28.38 -24.43 -107.32 -1.33c-16.44,0 -36.8,3.12 -36.99,25.09l115.93 0.67z",
  "M412.32 139.02c0,16.85 -16.85,27.47 -35.78,27.47 -45.24,0 -52.16,-21.24 -57.47,-21.24l-17.25 17.25c27.58,35.3 145.82,53.07 145.82,-23.49 0,-72.71 -104.56,-34.85 -104.56,-66.74 0,-17.97 22.62,-22.58 36.93,-22.58 20.77,0 44.55,11.54 44.55,11.54l11.16 -19.33 2.33 -4.04c-21.05,-9.97 -33.5,-14.72 -58.04,-14.72 -30.93,0 -71.32,18.23 -72.25,49.16 -2.31,75.94 104.56,24.89 104.56,66.7z",
  "M513.63 129.53c3.46,-9.69 7.85,-8.77 14.08,-8.77l36.75 0 7.69 0 24.63 0c6.23,0 10.62,-0.92 14.08,8.77l6.9 20.06c4.54,13.19 9.53,26.61 13.71,39.88l24.44 0 5.63 0.04c-1.49,-4.46 -3.07,-8.76 -4.62,-13.16l-45.23 -128.93c-1.76,-4.98 -3.16,-8.9 -4.06,-11.38 -1.15,-4.15 -5.31,-10.85 -10.62,-10.85l-24.87 0 -19.8 0 -24.86 0c-5.31,0 -9.46,6.69 -10.62,10.85 -0.9,2.48 -2.3,6.4 -4.06,11.38l-45.23 128.93c-1.55,4.4 -3.13,8.7 -4.62,13.16l5.63 -0.04 24.44 0c4.18,-13.28 9.17,-26.69 13.71,-39.88l6.9 -20.06zm58.52 -33.24l-7.69 0 -30.28 0c-7.85,0 -8.08,-2.31 -5.54,-9.69l10.16 -28.62c1.15,-3 3.23,-4.85 6.23,-4.62 7.5,0 26.95,0 34.45,0 3,-0.23 5.08,1.61 6.23,4.62l10.16 28.62c2.54,7.39 2.31,9.69 -5.54,9.69l-18.17 0z",
  "M835.89 110.48c0,42.47 32.78,82.17 83.55,82.4 50.78,-0.23 83.56,-39.93 83.56,-82.4 0,-50.55 -34.39,-87.25 -83.56,-87.48 -49.16,0.23 -83.55,36.93 -83.55,87.48zm83.55 55.86c-32.31,-0.23 -48.47,-27.47 -48.24,-55.86 0.23,-31.39 15.93,-60.47 48.24,-60.93 32.31,0.46 48.01,29.54 48.24,60.93 0.23,28.39 -15.93,55.63 -48.24,55.86z",
  "M738.44 149.73c-0.59,-0.03 -1.2,-0.55 -1.76,-1.56 -2.18,-4 -15.62,-32.03 -28.59,-59.11l-27.27 -56.26 -3.94 -8.12 -13.74 0 -0.26 0 -0.26 0 -0.26 0 -4.5 0 -4.5 0c-0.03,0 -0.06,0 -0.09,0l-9.22 0 10.71 22.06c-0.18,-0.39 -0.35,-0.78 -0.5,-1.16 0.57,1.23 1.17,2.5 1.78,3.79l10.39 21.41c2.38,4.84 4.33,8.81 5.31,10.93 13.42,26.94 31.43,62.02 50.87,98.99 0.67,1.28 1.36,2.35 2.09,3.26 1.62,2.01 3.53,3.32 5.94,4.06 1.77,0.52 3.69,0.69 5.82,0.74 0.23,0.01 0.46,0.01 0.69,0.01l1.31 0 1.31 0c0.23,-0 0.46,-0.01 0.69,-0.01 2.12,-0.05 4.05,-0.22 5.82,-0.74 2.41,-0.74 4.32,-2.06 5.94,-4.06 0.73,-0.91 1.42,-1.98 2.09,-3.26 19.45,-36.97 37.45,-72.06 50.87,-98.99 0.98,-2.12 2.93,-6.09 5.31,-10.93l10.39 -21.41c0.61,-1.29 1.21,-2.56 1.78,-3.79 -0.15,0.38 -0.32,0.76 -0.5,1.16l10.71 -22.06 -9.22 0c-0.03,0 -0.06,0 -0.09,0l-4.5 0 -4.5 0 -0.26 0 -0.26 0 -0.26 0 -13.74 0 -3.94 8.12 -27.27 56.26c-12.98,27.07 -26.41,55.11 -28.59,59.11 -0.56,1.01 -1.17,1.53 -1.76,1.56z",
];
const MARK_PATHS = SAVO_PATHS.slice(0, 3);

const s = StyleSheet.create({
  page: { backgroundColor: PAGE_BG, paddingVertical: 26, paddingHorizontal: 24, alignItems: "center", fontFamily: "Helvetica", color: INK },
  card: { width: 452, maxWidth: "100%", backgroundColor: CARD, borderRadius: 22, borderWidth: 1, borderColor: BORDER },

  header: { backgroundColor: INK, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 22 },
  headerContact: { fontSize: 9.5, lineHeight: 1.5, color: HEADER_MUTED, marginTop: 11 },

  section: { paddingHorizontal: 24 },
  label: { fontSize: 9, letterSpacing: 0.8, color: LABEL, textTransform: "uppercase" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  docLabel: { fontSize: 9.5, letterSpacing: 1.4, color: LABEL, textTransform: "uppercase" },
  docNo: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 3 },
  pill: { fontSize: 9.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },

  datesRow: { flexDirection: "row", marginTop: 14 },
  dateCol: { marginRight: 30 },
  dateVal: { fontSize: 12.5, fontFamily: "Helvetica-Bold", marginTop: 3 },

  billed: { marginTop: 16, marginHorizontal: 24, paddingVertical: 13, paddingHorizontal: 15, backgroundColor: BILLED_BG, borderRadius: 14 },
  billedName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 5 },
  billedDetail: { fontSize: 11.5, color: MUTED, lineHeight: 1.5, marginTop: 2 },

  itemsWrap: { paddingHorizontal: 24, paddingTop: 18 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DIVIDER },
  itemName: { fontSize: 13, fontFamily: "Helvetica-Bold", lineHeight: 1.35 },
  itemQty: { fontSize: 11.5, color: MUTED, marginTop: 4 },
  itemSub: { fontSize: 13, fontFamily: "Helvetica-Bold", marginLeft: 12 },

  adjWrap: { paddingHorizontal: 24, paddingTop: 14 },
  adjRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5 },
  adjLabel: { fontSize: 12, color: MUTED },
  adjVal: { fontSize: 12, fontFamily: "Helvetica-Bold" },

  totalBox: { marginTop: 16, marginHorizontal: 24, paddingVertical: 15, paddingHorizontal: 17, backgroundColor: ACCENT, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 10, letterSpacing: 1, color: TOTAL_LABEL, textTransform: "uppercase" },
  totalValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#FFFFFF", marginTop: 2 },

  dpRow: { marginTop: 10, marginHorizontal: 24, flexDirection: "row", justifyContent: "space-between" },
  dueRow: { marginTop: 7, marginHorizontal: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingTop: 8, borderTopWidth: 1, borderTopColor: "#DFD4C2", borderTopStyle: "dashed" },

  panel: { marginTop: 18, marginHorizontal: 24, paddingVertical: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: BORDER, borderRadius: 14, backgroundColor: PAY_BG },
  panelStrong: { fontSize: 13.5, fontFamily: "Helvetica-Bold", marginTop: 5 },

  note: { marginTop: 12, marginHorizontal: 24, fontSize: 10, color: MUTED, lineHeight: 1.5 },
  thanks: { marginTop: 16, paddingHorizontal: 24, paddingBottom: 24, textAlign: "center", fontSize: 11, color: LABEL, lineHeight: 1.5 },
});

function statusPillStyle(label: string) {
  const l = label.toLowerCase();
  if (l.includes("lunas")) return { backgroundColor: "#E5F1E8", color: "#1F8A4D" };
  if (l.includes("sebagian") || l.includes("partial"))
    return { backgroundColor: "#FBF1DF", color: "#B77A22" };
  return { backgroundColor: "#F7E4DE", color: ACCENT };
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { business, invoice, customer, order, items } = data;
  const docType: SalesDocType = data.doc_type ?? "invoice";
  const dp = Number(data.down_payment ?? 0);
  const hasDp = dp > 0;
  const pill = statusPillStyle(invoice.payment_status_label);

  const contact = [business.address, business.phone_wa, business.instagram, business.email]
    .filter(Boolean)
    .join("  •  ");
  const customerDetail = [customer?.business_name, customer?.phone_wa ? `WA ${customer.phone_wa}` : null, customer?.address]
    .filter(Boolean)
    .join("  •  ");
  const totalLabel = docType === "invoice" ? "Total tagihan" : "Total";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.card}>
          {/* Brand header */}
          <View style={s.header}>
            <Svg viewBox="0 0 1003 206.2" width={108} height={22}>
              {SAVO_PATHS.map((d, i) => (
                <Path key={i} d={d} fill={CARD} />
              ))}
            </Svg>
            {contact ? <Text style={s.headerContact}>{contact}</Text> : null}
          </View>

          {/* Status + doc meta */}
          <View style={s.section}>
            <View style={s.metaRow}>
              <View>
                <Text style={s.docLabel}>{DOC_TITLE[docType]}</Text>
                <Text style={s.docNo}>{invoice.invoice_no}</Text>
              </View>
              {docType === "invoice" ? (
                <Text style={[s.pill, { backgroundColor: pill.backgroundColor, color: pill.color }]}>
                  {invoice.payment_status_label.toUpperCase()}
                </Text>
              ) : null}
            </View>

            <View style={s.datesRow}>
              <View style={s.dateCol}>
                <Text style={s.label}>Tanggal</Text>
                <Text style={s.dateVal}>{formatDate(invoice.issue_date)}</Text>
              </View>
              {invoice.due_date ? (
                <View style={s.dateCol}>
                  <Text style={s.label}>{docType === "penawaran" ? "Berlaku s.d." : "Jatuh tempo"}</Text>
                  <Text style={s.dateVal}>{formatDate(invoice.due_date)}</Text>
                </View>
              ) : null}
              {order.order_no ? (
                <View style={s.dateCol}>
                  <Text style={s.label}>No. Pesanan</Text>
                  <Text style={s.dateVal}>{order.order_no}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Billed to */}
          <View style={s.billed}>
            <Text style={s.label}>{docType === "invoice" ? "Ditagihkan kepada" : "Kepada"}</Text>
            <Text style={s.billedName}>{customer?.name ?? "Pelanggan Umum"}</Text>
            {customerDetail ? <Text style={s.billedDetail}>{customerDetail}</Text> : null}
          </View>

          {/* Items */}
          <View style={s.itemsWrap}>
            <Text style={[s.label, { marginBottom: 8 }]}>Rincian</Text>
            {items.map((it, i) => (
              <View style={s.itemRow} key={i} wrap={false}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{it.name}</Text>
                  <Text style={s.itemQty}>
                    {it.qty} × {formatIDR(it.unit_price)}
                  </Text>
                </View>
                <Text style={s.itemSub}>{formatIDR(it.subtotal)}</Text>
              </View>
            ))}
          </View>

          {/* Adjustments */}
          <View style={s.adjWrap}>
            <View style={s.adjRow}>
              <Text style={s.adjLabel}>Subtotal</Text>
              <Text style={s.adjVal}>{formatIDR(order.subtotal)}</Text>
            </View>
            {order.discount > 0 ? (
              <View style={s.adjRow}>
                <Text style={s.adjLabel}>Diskon</Text>
                <Text style={s.adjVal}>- {formatIDR(order.discount)}</Text>
              </View>
            ) : null}
            {order.shipping > 0 ? (
              <View style={s.adjRow}>
                <Text style={s.adjLabel}>Ongkir</Text>
                <Text style={s.adjVal}>{formatIDR(order.shipping)}</Text>
              </View>
            ) : null}
            {order.tax > 0 ? (
              <View style={s.adjRow}>
                <Text style={s.adjLabel}>Pajak</Text>
                <Text style={s.adjVal}>{formatIDR(order.tax)}</Text>
              </View>
            ) : null}
          </View>

          {/* Grand total */}
          <View style={s.totalBox}>
            <View>
              <Text style={s.totalLabel}>{totalLabel}</Text>
              <Text style={s.totalValue}>{formatIDR(order.total)}</Text>
            </View>
            <Svg viewBox="-12 -14 260 236" width={34} height={30} style={{ opacity: 0.5 }}>
              {MARK_PATHS.map((d, i) => (
                <Path key={i} d={d} fill={WATERMARK} />
              ))}
            </Svg>
          </View>

          {/* Deposit + remaining */}
          {hasDp ? (
            <>
              <View style={s.dpRow}>
                <Text style={s.adjLabel}>Sudah dibayar (DP)</Text>
                <Text style={s.adjVal}>- {formatIDR(dp)}</Text>
              </View>
              <View style={s.dueRow}>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold" }}>Sisa tagihan</Text>
                <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", color: ACCENT }}>
                  {formatIDR(Math.max(0, order.total - dp))}
                </Text>
              </View>
            </>
          ) : null}

          {/* Keterangan (promo) */}
          {data.promo_note ? (
            <View style={[s.panel, { backgroundColor: BILLED_BG, borderColor: BORDER }]}>
              <Text style={s.label}>Keterangan</Text>
              <Text style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{data.promo_note}</Text>
            </View>
          ) : null}

          {/* Doc-type notes */}
          {docType === "penawaran" ? (
            <Text style={s.note}>
              Dokumen ini adalah penawaran harga — bukan tagihan. Harga &amp;
              ketersediaan berlaku sampai tanggal di atas (bila diisi) atau maksimal
              14 hari.
            </Text>
          ) : null}
          {docType === "sales_order" ? (
            <Text style={s.note}>
              Sales Order ini konfirmasi pesanan beserta finalisasi harga, diskon, dan
              ketentuan transaksi. Invoice diterbitkan terpisah untuk penagihan.
            </Text>
          ) : null}

          {/* Payment */}
          {business.bank_name || business.bank_account_no ? (
            <View style={s.panel}>
              <Text style={s.label}>Transfer ke</Text>
              <Text style={s.panelStrong}>
                {business.bank_name}
                {business.bank_account_no ? ` - ${business.bank_account_no}` : ""}
              </Text>
              {business.bank_account_name ? (
                <Text style={s.billedDetail}>a.n. {business.bank_account_name}</Text>
              ) : null}
            </View>
          ) : null}

          {business.invoice_notes ? <Text style={s.note}>{business.invoice_notes}</Text> : null}

          <Text style={s.thanks}>
            Terima kasih atas pesanan Anda — {business.business_name || "SAVO"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
