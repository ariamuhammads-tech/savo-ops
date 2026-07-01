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

export type InvoicePdfData = {
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

const INK = "#1F1A17";
const MUTED = "#6B6258";
const ACCENT = "#C0492B";
const BORDER = "#E7DDCC";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { fontSize: 24, fontFamily: "Helvetica-Bold", color: ACCENT, marginLeft: 6 },
  biz: { fontSize: 9, color: MUTED, marginTop: 2, maxWidth: 240 },
  invTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right" },
  invMeta: { fontSize: 9, color: MUTED, textAlign: "right", marginTop: 2 },
  hr: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 14 },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 8, color: MUTED, textTransform: "uppercase", marginBottom: 3 },
  strong: { fontFamily: "Helvetica-Bold" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#F1E9DC",
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  cName: { flex: 4 },
  cQty: { flex: 1.2, textAlign: "right" },
  cPrice: { flex: 2, textAlign: "right" },
  cSub: { flex: 2, textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 4,
    paddingTop: 4,
  },
  grandText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: ACCENT },
  footer: { marginTop: 22 },
  bankBox: { backgroundColor: "#FBF7F0", borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 10, marginTop: 8 },
  note: { fontSize: 8, color: MUTED, marginTop: 12 },
});

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { business, invoice, customer, order, items } = data;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <View style={s.brandRow}>
              <Svg viewBox="0 0 224 206.2" width={26} height={24}>
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
            <Text style={s.invTitle}>INVOICE</Text>
            <Text style={s.invMeta}>{invoice.invoice_no}</Text>
            <Text style={s.invMeta}>Tanggal: {formatDate(invoice.issue_date)}</Text>
            {invoice.due_date ? (
              <Text style={s.invMeta}>Jatuh tempo: {formatDate(invoice.due_date)}</Text>
            ) : null}
            <Text style={s.invMeta}>Status: {invoice.payment_status_label}</Text>
          </View>
        </View>

        <View style={s.hr} />

        <View style={s.twoCol}>
          <View style={{ maxWidth: 260 }}>
            <Text style={s.label}>Ditagihkan kepada</Text>
            <Text style={s.strong}>{customer?.name ?? "Pelanggan Umum"}</Text>
            {customer?.business_name ? <Text>{customer.business_name}</Text> : null}
            {customer?.address ? <Text style={{ color: MUTED }}>{customer.address}</Text> : null}
            {customer?.phone_wa ? <Text style={{ color: MUTED }}>WA: {customer.phone_wa}</Text> : null}
          </View>
          {order.order_no ? (
            <View>
              <Text style={s.label}>No. Pesanan</Text>
              <Text style={s.strong}>{order.order_no}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.tableHead}>
          <Text style={[s.cName, s.strong]}>Produk</Text>
          <Text style={[s.cQty, s.strong]}>Qty</Text>
          <Text style={[s.cPrice, s.strong]}>Harga</Text>
          <Text style={[s.cSub, s.strong]}>Subtotal</Text>
        </View>
        {items.map((it, i) => (
          <View style={s.row} key={i}>
            <Text style={s.cName}>{it.name}</Text>
            <Text style={s.cQty}>{it.qty}</Text>
            <Text style={s.cPrice}>{formatIDR(it.unit_price)}</Text>
            <Text style={s.cSub}>{formatIDR(it.subtotal)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={{ color: MUTED }}>Subtotal</Text>
            <Text>{formatIDR(order.subtotal)}</Text>
          </View>
          {order.discount > 0 ? (
            <View style={s.totalRow}>
              <Text style={{ color: MUTED }}>Diskon</Text>
              <Text>- {formatIDR(order.discount)}</Text>
            </View>
          ) : null}
          {order.shipping > 0 ? (
            <View style={s.totalRow}>
              <Text style={{ color: MUTED }}>Ongkir</Text>
              <Text>{formatIDR(order.shipping)}</Text>
            </View>
          ) : null}
          {order.tax > 0 ? (
            <View style={s.totalRow}>
              <Text style={{ color: MUTED }}>Pajak</Text>
              <Text>{formatIDR(order.tax)}</Text>
            </View>
          ) : null}
          <View style={s.grand}>
            <Text style={s.grandText}>TOTAL</Text>
            <Text style={s.grandText}>{formatIDR(order.total)}</Text>
          </View>
        </View>

        <View style={s.footer}>
          {business.bank_name || business.bank_account_no ? (
            <View style={s.bankBox}>
              <Text style={s.label}>Pembayaran transfer ke</Text>
              <Text style={s.strong}>
                {business.bank_name} {business.bank_account_no ? `- ${business.bank_account_no}` : ""}
              </Text>
              {business.bank_account_name ? (
                <Text style={{ color: MUTED }}>a.n. {business.bank_account_name}</Text>
              ) : null}
            </View>
          ) : null}
          {business.invoice_notes ? <Text style={s.note}>{business.invoice_notes}</Text> : null}
          <Text style={s.note}>Terima kasih atas pesanan Anda. — {business.business_name || "SAVO"}</Text>
        </View>
      </Page>
    </Document>
  );
}
