import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MessageCircle, Trash2, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { deleteInvoice } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

const INV_STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Jatuh tempo",
  cancelled: "Dibatalkan",
};
const INV_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  draft: "outline",
  sent: "primary",
  paid: "success",
  overdue: "destructive",
  cancelled: "destructive",
};

type Detail = {
  id: string;
  invoice_no: string | null;
  issue_date: string;
  due_date: string | null;
  status: string;
  total: number;
  order: { id: string; order_no: string | null } | null;
  customer: { name: string; phone_wa: string | null } | null;
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_no, issue_date, due_date, status, total, order:orders(id, order_no), customer:customers(name, phone_wa)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const inv = data as unknown as Detail;

  const waDigits = (inv.customer?.phone_wa ?? "").replace(/\D/g, "");
  const waMsg = encodeURIComponent(
    `Halo${inv.customer?.name ? " " + inv.customer.name : ""}, berikut invoice ${inv.invoice_no} SAVO ` +
      `sebesar ${formatIDR(Number(inv.total))}` +
      (inv.due_date ? `, jatuh tempo ${formatDate(inv.due_date)}` : "") +
      `. File PDF menyusul ya. Terima kasih!`,
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link
        href="/invoice"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {inv.invoice_no}
        </h1>
        <Badge variant={INV_STATUS_VARIANT[inv.status] ?? "outline"}>
          {INV_STATUS_LABEL[inv.status] ?? inv.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-5 text-primary" />
            Rincian Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Pelanggan" value={inv.customer?.name ?? "Umum"} />
          <Row label="Tanggal terbit" value={formatDate(inv.issue_date)} />
          {inv.due_date && <Row label="Jatuh tempo" value={formatDate(inv.due_date)} />}
          {inv.order?.order_no && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pesanan</span>
              <Link href={`/pesanan/${inv.order.id}`} className="font-medium text-primary underline">
                {inv.order.order_no}
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Total</span>
            <span className="font-serif text-lg font-bold text-primary">
              {formatIDR(Number(inv.total))}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild>
          <a href={`/api/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer">
            <Download />
            Unduh PDF
          </a>
        </Button>
        {waDigits && (
          <Button asChild variant="secondary">
            <a href={`https://wa.me/${waDigits}?text=${waMsg}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              Kirim via WhatsApp
            </a>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: unduh PDF-nya dulu, lalu lampirkan di chat WhatsApp pelanggan.
      </p>

      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <p className="text-sm font-medium">Hapus invoice</p>
          <form action={deleteInvoice}>
            <input type="hidden" name="id" value={inv.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus invoice ${inv.invoice_no}?`}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
