import { Suspense } from "react";
import { TrendingUp, TrendingDown, Wallet, ShoppingBag, Receipt, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";
import { ExpenseForm } from "./expense-form";
import { deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function KeuanganPage() {
  const supabase = await createClient();
  const monthStart = formatDate(new Date(), "yyyy-MM") + "-01";
  const today = formatDate(new Date(), "yyyy-MM-dd");

  const [{ data: payments }, { data: purchases }, { data: expenses }] =
    await Promise.all([
      supabase.from("payments").select("amount, status, paid_at"),
      supabase.from("purchases").select("total, purchase_date"),
      supabase
        .from("expenses")
        .select("id, expense_date, category, description, amount")
        .order("expense_date", { ascending: false }),
    ]);

  const inMonth = (d: string) => (d ?? "").slice(0, 10) >= monthStart;

  const revenueMonth = (payments ?? [])
    .filter((p) => p.status === "settled" && inMonth(p.paid_at))
    .reduce((s, p) => s + Number(p.amount), 0);
  const purchaseMonth = (purchases ?? [])
    .filter((p) => inMonth(p.purchase_date))
    .reduce((s, p) => s + Number(p.total), 0);
  const expenseMonth = (expenses ?? [])
    .filter((e) => inMonth(e.expense_date))
    .reduce((s, e) => s + Number(e.amount), 0);
  const outMonth = purchaseMonth + expenseMonth;
  const netMonth = revenueMonth - outMonth;

  const revenueTotal = (payments ?? [])
    .filter((p) => p.status === "settled")
    .reduce((s, p) => s + Number(p.amount), 0);
  const outTotal =
    (purchases ?? []).reduce((s, p) => s + Number(p.total), 0) +
    (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const netTotal = revenueTotal - outTotal;

  return (
    <div className="space-y-5">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Keuangan</h1>
        <p className="text-sm text-muted-foreground">Ringkasan bulan ini.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          icon={<TrendingUp className="size-5 text-[color:var(--success)]" />}
          label="Pemasukan"
          value={formatIDR(revenueMonth)}
        />
        <Kpi
          icon={<TrendingDown className="size-5 text-destructive" />}
          label="Pengeluaran"
          value={formatIDR(outMonth)}
        />
      </div>
      <Card className="border-primary/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            <span className="font-medium">Laba bersih (bulan ini)</span>
          </div>
          <span
            className={
              "font-serif text-2xl font-bold " +
              (netMonth < 0 ? "text-destructive" : "text-[color:var(--success)]")
            }
          >
            {formatIDR(netMonth)}
          </span>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian Pengeluaran (bulan ini)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row icon={<ShoppingBag className="size-4 text-muted-foreground" />} label="Pembelian bahan" value={formatIDR(purchaseMonth)} />
          <Row icon={<Receipt className="size-4 text-muted-foreground" />} label="Operasional" value={formatIDR(expenseMonth)} />
          <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Total pengeluaran</span>
            <span>{formatIDR(outMonth)}</span>
          </div>
        </CardContent>
      </Card>

      {/* All-time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sepanjang Waktu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Total pemasukan" value={formatIDR(revenueTotal)} />
          <Row label="Total pengeluaran" value={formatIDR(outTotal)} />
          <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Laba bersih total</span>
            <span className={netTotal < 0 ? "text-destructive" : "text-[color:var(--success)]"}>
              {formatIDR(netTotal)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Add expense */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catat Pengeluaran Operasional</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm defaultDate={today} />
        </CardContent>
      </Card>

      {/* Expense list */}
      {(expenses ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengeluaran Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {(expenses ?? []).slice(0, 30).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category ? e.category + " · " : ""}
                      {formatDate(e.expense_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-destructive">
                      −{formatIDR(Number(e.amount))}
                    </span>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <SubmitButton variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 />
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary">{icon}</div>
        </div>
        <p className="font-serif text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}
