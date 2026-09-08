import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Plus, FileSpreadsheet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { FlashToast } from "@/components/flash-toast";
import { PipelineStepper } from "@/components/pipeline-stepper";

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
    <div className="content-container space-y-10">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      {/* 4-Step Pipeline Stepper */}
      <PipelineStepper
        currentStep={4}
        stats={{
          dealCount: invoices.length,
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-border/40 pb-6">
        <div>
          <span className="text-xs text-muted-foreground">
            Tahap 4 dari 4 · Kesepakatan &amp; Invoicing Grosir B2B
          </span>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
            Deal &amp; Invoice B2B
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Terbitkan invoice penjualan grosir resmi untuk kafe mitra di Bandung. Dilengkapi preset harga Bitterballen &amp; Baso Goreng serta unduh PDF langsung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/follow-up"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>← Kembali ke Follow-Up</span>
          </Link>
          <Link
            href="/invoice/baru"
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>Buat Invoice Baru</span>
          </Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 px-6 text-center border-t border-b border-border/40">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/40 text-foreground">
            <FileSpreadsheet className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-foreground">Belum Ada Invoice Aktif</p>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              Buat invoice B2B instan untuk kafe, resto, atau lounge mitra SAVO di Bandung. Dilengkapi preset harga grosir Baso Goreng & Bitterballen serta unduh PDF langsung.
            </p>
          </div>
          <Link
            href="/invoice/baru"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3.5" />
            <span>Mulai Buat Invoice Pertama</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border border-t border-b border-border">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoice/${inv.id}`} className="block">
              <div className="flex items-center justify-between gap-4 py-4 px-2 hover:bg-secondary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono font-bold text-sm text-foreground">{inv.invoice_no ?? "—"}</p>
                    <Badge variant={INV_STATUS_VARIANT[inv.status] ?? "outline"}>
                      {INV_STATUS_LABEL[inv.status] ?? inv.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs">
                    <span className="font-semibold text-foreground">
                      {inv.customer?.name ?? inv.order?.contact_name ?? "Umum"}
                    </span>
                    {(inv.customer?.phone_wa ?? inv.order?.contact_phone) && (
                      <span className="text-muted-foreground font-mono">
                        {" · "}
                        {inv.customer?.phone_wa ?? inv.order?.contact_phone}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {formatDate(inv.issue_date)} ·{" "}
                    <span className="font-bold text-foreground">
                      {formatIDR(Number(inv.total))}
                    </span>
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
