import { Suspense } from "react";
import Link from "next/link";
import { ReceiptText, ChevronRight } from "lucide-react";

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
  customer: { name: string } | null;
};

export default async function InvoicePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_no, issue_date, total, status, customer:customers(name)")
    .order("created_at", { ascending: false });

  const invoices = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Invoice</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(invoices.length)} invoice
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <ReceiptText className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada invoice</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Buat invoice dari halaman detail pesanan (tombol “Buat Invoice”).
          </p>
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
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {inv.customer?.name ?? "Umum"} · {formatDate(inv.issue_date)} ·{" "}
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
