import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, MessageCircle, Wallet, ReceiptText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import {
  updateOrderStatus,
  deleteOrder,
  addPayment,
  deletePayment,
} from "../actions";
import { createInvoiceFromOrder } from "../../invoice/actions";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_VARIANT,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VARIANT,
  METHOD_LABEL,
  type OrderStatus,
} from "../labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton, ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

type Detail = {
  id: string;
  order_no: string | null;
  order_date: string;
  status: OrderStatus;
  channel: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  payment_status: string;
  notes: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  customer: { name: string; phone_wa: string | null } | null;
  order_items: { id: string; name: string | null; qty: number; unit_price: number; subtotal: number }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    paid_at: string;
    reference: string | null;
  }[];
};

export default async function PesananDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_no, order_date, status, channel, subtotal, discount, shipping, tax, total, payment_status, notes, contact_name, contact_phone, customer:customers(name, phone_wa), order_items(id, name, qty, unit_price, subtotal), payments(id, amount, method, paid_at, reference)",
    )
    .eq("id", id)
    .single();

  if (!data) notFound();
  const order = data as unknown as Detail;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_no")
    .eq("order_id", id)
    .maybeSingle();

  const paid = order.payments
    .reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Number(order.total) - paid;
  const today = formatDate(new Date(), "yyyy-MM-dd");

  const contactName = order.customer?.name ?? order.contact_name ?? null;
  const contactPhone = order.customer?.phone_wa ?? order.contact_phone ?? "";
  const waDigits = contactPhone.replace(/\D/g, "");
  const waMsg = encodeURIComponent(
    `Halo${contactName ? " " + contactName : ""}, ` +
      `pesanan ${order.order_no} SAVO:\nTotal ${formatIDR(Number(order.total))}\n` +
      `Status bayar: ${PAYMENT_STATUS_LABEL[order.payment_status]}. Terima kasih!`,
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link
        href="/pesanan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {order.order_no}
        </h1>
        <Badge variant={STATUS_VARIANT[order.status]}>
          {STATUS_LABEL[order.status]}
        </Badge>
        <Badge variant={PAYMENT_STATUS_VARIANT[order.payment_status]}>
          {PAYMENT_STATUS_LABEL[order.payment_status]}
        </Badge>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        {contactName ?? "Umum"}
        {contactPhone ? ` · ${contactPhone}` : ""} · {formatDate(order.order_date)}
      </p>

      {/* Items + totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y divide-border">
            {order.order_items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(it.qty)} × {formatIDR(Number(it.unit_price))}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatIDR(Number(it.subtotal))}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <TotalRow label="Subtotal" value={formatIDR(Number(order.subtotal))} />
            {Number(order.discount) > 0 && (
              <TotalRow label="Diskon" value={"− " + formatIDR(Number(order.discount))} />
            )}
            {Number(order.shipping) > 0 && (
              <TotalRow label="Ongkir" value={formatIDR(Number(order.shipping))} />
            )}
            {Number(order.tax) > 0 && (
              <TotalRow label="Pajak" value={formatIDR(Number(order.tax))} />
            )}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-medium">Total</span>
              <span className="font-serif text-lg font-bold text-primary">
                {formatIDR(Number(order.total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateOrderStatus} className="flex items-end gap-2">
            <input type="hidden" name="id" value={order.id} />
            <div className="flex-1 space-y-1">
              <Label htmlFor="status" className="text-xs">
                Ubah status
              </Label>
              <Select id="status" name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton variant="secondary">Perbarui</SubmitButton>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Saat status “Dikirim” atau “Selesai”, stok produk otomatis dipotong
            (sekali).
          </p>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-5 text-primary" />
            Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Terbayar</span>
            <span className="font-medium">{formatIDR(paid)}</span>
          </div>
          <div className="flex items-center justify-between px-3 text-sm">
            <span className="text-muted-foreground">Sisa</span>
            <span className={"font-semibold " + (remaining > 0 ? "text-destructive" : "text-[color:var(--success)]")}>
              {formatIDR(remaining)}
            </span>
          </div>

          {order.payments.length > 0 && (
            <ul className="divide-y divide-border">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatIDR(Number(p.amount))}</p>
                    <p className="text-xs text-muted-foreground">
                      {METHOD_LABEL[p.method] ?? p.method} · {formatDate(p.paid_at)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                  <form action={deletePayment}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <SubmitButton variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 />
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={addPayment} className="space-y-3 rounded-lg border border-border p-3">
            <input type="hidden" name="order_id" value={order.id} />
            <p className="text-sm font-medium">Catat pembayaran</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-xs">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="any"
                  defaultValue={remaining > 0 ? Math.round(remaining) : ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="method" className="text-xs">Metode</Label>
                <Select id="method" name="method" defaultValue="transfer">
                  {Object.entries(METHOD_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="paid_at" className="text-xs">Tanggal</Label>
                <Input id="paid_at" name="paid_at" type="date" defaultValue={today} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reference" className="text-xs">Referensi</Label>
                <Input id="reference" name="reference" placeholder="mis. transfer BCA" />
              </div>
            </div>
            <SubmitButton className="w-full">Simpan pembayaran</SubmitButton>
          </form>
        </CardContent>
      </Card>

      {/* Invoice */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Invoice</p>
              <p className="text-xs text-muted-foreground">
                {invoice ? invoice.invoice_no : "Belum dibuat"}
              </p>
            </div>
          </div>
          {invoice ? (
            <Button asChild variant="secondary">
              <Link href={`/invoice/${invoice.id}`}>Lihat Invoice</Link>
            </Button>
          ) : (
            <form action={createInvoiceFromOrder}>
              <input type="hidden" name="order_id" value={order.id} />
              <SubmitButton>Buat Invoice</SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>

      {/* WA share */}
      {waDigits && (
        <Button asChild variant="secondary" className="w-full">
          <a href={`https://wa.me/${waDigits}?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            Kirim rincian via WhatsApp
          </a>
        </Button>
      )}

      {order.notes && (
        <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
          Catatan: {order.notes}
        </p>
      )}

      {/* Delete */}
      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <p className="text-sm font-medium">Hapus pesanan</p>
          <form action={deleteOrder}>
            <input type="hidden" name="id" value={order.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus pesanan ${order.order_no}? Termasuk item & pembayaran.`}
            >
              <Trash2 />
              Hapus
            </ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
