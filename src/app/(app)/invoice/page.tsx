import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Plus, FileSpreadsheet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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

type Row = {
  id: string;
  invoice_no: string | null;
  issue_date: string;
  total: number;
  status: string;
  customer: { name: string; phone_wa: string | null } | null;
  order: { contact_name: string | null; contact_phone: string | null } | null;
};

export default async function InvoicePage() {
  let invoices: Row[] = [];
  try {
    const supabase = await createClient();
    const timeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 1000),
    );
    const queryPromise = supabase
      .from("invoices")
      .select(
        "id, invoice_no, issue_date, total, status, customer:customers(name, phone_wa), order:orders(contact_name, contact_phone)",
      )
      .order("created_at", { ascending: false });

    const { data } = await Promise.race([queryPromise, timeoutPromise]);
    invoices = (data ?? []) as unknown as Row[];
  } catch {
    invoices = [];
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sistem Finansial B2B & Wholesale
          </span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Invoice Penjualan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatNumber(invoices.length)} invoice tercatat dalam sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoice/baru"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99]"
          >
            <Plus className="size-4" />
            + Buat Invoice Baru (B2B Instant)
          </Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center border border-dashed border-border bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-secondary/80 text-foreground">
            <FileSpreadsheet className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-base font-bold">Belum Ada Invoice Aktif</p>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              Buat invoice B2B instan untuk kafe, resto, atau lounge mitra SAVO di Bandung. Dilengkapi preset harga grosir Baso Goreng & Bitterballen serta unduh PDF langsung.
            </p>
          </div>
          <Link
            href="/invoice/baru"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Mulai Buat Invoice B2B
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoice/${inv.id}`}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{inv.invoice_no ?? "—"}</p>
                    <Badge variant={INV_STATUS_VARIANT[inv.status] ?? "outline"}>
                      {INV_STATUS_LABEL[inv.status] ?? inv.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm">
                    <span className="font-medium text-foreground">
                      {inv.customer?.name ?? inv.order?.contact_name ?? "Umum"}
                    </span>
                    {(inv.customer?.phone_wa ?? inv.order?.contact_phone) && (
                      <span className="text-muted-foreground">
                        {" · "}
                        {inv.customer?.phone_wa ?? inv.order?.contact_phone}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(inv.issue_date)} ·{" "}
                    <span className="font-medium text-foreground">
                      {formatIDR(Number(inv.total))}
                    </span>
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
