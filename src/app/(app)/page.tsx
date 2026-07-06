import Link from "next/link";
import {
  Package,
  Wheat,
  TriangleAlert,
  Timer,
  ArrowRight,
  TrendingUp,
  CalendarDays,
  ClipboardList,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR, formatNumber, formatDate } from "@/lib/format";
import { formatQty } from "@/lib/units";
import { StoveFlames } from "@/components/stove-flames";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = formatDate(new Date(), "yyyy-MM-dd");
  const monthStart = formatDate(new Date(), "yyyy-MM") + "-01";

  const [
    { data: products },
    { data: ingredients },
    { data: orders },
    { data: items },
    { data: payments },
    { data: purchases },
    { data: expenses },
    { data: buyMoves },
  ] = await Promise.all([
    supabase.from("products").select("id, name, unit, stock_qty, min_stock"),
    supabase
      .from("ingredients")
      .select("id, name, unit, stock_qty, min_stock, shelf_life_days"),
    supabase.from("orders").select("order_date, total, status, payment_status"),
    supabase
      .from("order_items")
      .select("name, qty, order:orders(order_date, status)")
      .limit(2000),
    supabase.from("payments").select("amount, paid_at").eq("status", "settled"),
    supabase.from("purchases").select("total, purchase_date"),
    supabase.from("expenses").select("amount, expense_date"),
    // Pembelian terakhir per bahan — dasar "timer" masa segar.
    supabase
      .from("stock_movements")
      .select("item_id, created_at")
      .eq("item_type", "ingredient")
      .eq("movement_type", "purchase")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const activeOrders = (orders ?? []).filter((o) => o.status !== "cancelled");
  const salesToday = activeOrders
    .filter((o) => o.order_date === today)
    .reduce((s, o) => s + Number(o.total), 0);
  const salesMonth = activeOrders
    .filter((o) => o.order_date >= monthStart)
    .reduce((s, o) => s + Number(o.total), 0);
  const openOrders = activeOrders.filter((o) =>
    ["draft", "confirmed", "in_production", "ready"].includes(o.status),
  ).length;
  const unpaidCount = activeOrders.filter((o) => o.payment_status !== "paid").length;

  // Top products this month (by qty)
  const topMap = new Map<string, number>();
  for (const it of items ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ord = (it as any).order;
    if (!ord || ord.status === "cancelled" || ord.order_date < monthStart) continue;
    const name = it.name ?? "-";
    topMap.set(name, (topMap.get(name) ?? 0) + Number(it.qty));
  }
  const topProducts = [...topMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lowProducts = (products ?? []).filter(
    (p) => Number(p.stock_qty) <= Number(p.min_stock) && Number(p.min_stock) > 0,
  );
  const lowIngredients = (ingredients ?? []).filter(
    (i) => Number(i.stock_qty) <= Number(i.min_stock) && Number(i.min_stock) > 0,
  );

  // Keuangan bulan ini (ringkas — tap menuju rinciannya).
  const inThisMonth = (d: string | null | undefined) =>
    String(d ?? "").slice(0, 10) >= monthStart;
  const cashIn = (payments ?? [])
    .filter((p) => inThisMonth(p.paid_at))
    .reduce((s, p) => s + Number(p.amount), 0);
  const cashOut =
    (purchases ?? [])
      .filter((p) => inThisMonth(p.purchase_date))
      .reduce((s, p) => s + Number(p.total), 0) +
    (expenses ?? [])
      .filter((e) => inThisMonth(e.expense_date))
      .reduce((s, e) => s + Number(e.amount), 0);

  // Timer masa segar: umur bahan sejak pembelian terakhir vs shelf_life_days.
  const lastBuy = new Map<string, string>();
  for (const m of buyMoves ?? []) {
    if (m.item_id && !lastBuy.has(m.item_id)) lastBuy.set(m.item_id, m.created_at);
  }
  const nowMs = Date.now();
  const staleIngredients: {
    id: string;
    name: string;
    shelfDays: number;
    ageDays: number;
  }[] = [];
  for (const i of ingredients ?? []) {
    const shelfDays = Number(i.shelf_life_days ?? 0);
    if (shelfDays <= 0 || Number(i.stock_qty) <= 0) continue;
    const bought = lastBuy.get(i.id);
    if (!bought) continue;
    const ageDays = Math.floor((nowMs - Date.parse(bought)) / 86400000);
    if (ageDays > shelfDays)
      staleIngredients.push({ id: i.id, name: i.name, shelfDays, ageDays });
  }

  return (
    <div className="space-y-6">
      <StoveFlames intensity={0.55} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
          SAVO Ops
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional {formatDate(new Date(), "dd MMM yyyy")}.
        </p>
        <div className="savo-hairline mt-4" />
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<TrendingUp className="size-5 text-primary" />} label="Penjualan hari ini" value={formatIDR(salesToday)} />
        <Kpi icon={<CalendarDays className="size-5 text-primary" />} label="Penjualan bulan ini" value={formatIDR(salesMonth)} />
        <Kpi icon={<ClipboardList className="size-5 text-primary" />} label="Pesanan berjalan" value={formatNumber(openOrders)} href="/pesanan" />
        <Kpi icon={<Wallet className="size-5 text-primary" />} label="Belum lunas" value={formatNumber(unpaidCount)} href="/pesanan" />
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<Package className="size-5 text-primary" />} label="Produk" value={formatNumber(products?.length ?? 0)} href="/produk" />
        <Kpi icon={<Wheat className="size-5 text-primary" />} label="Bahan Baku" value={formatNumber(ingredients?.length ?? 0)} href="/bahan" />
      </div>

      {/* Keuangan bulan ini — tap menuju rincian (review 2026-07-06) */}
      <Link href="/keuangan/laba-rugi" className="block">
        <Card className="savo-lift hover:border-primary/40">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Keuangan bulan ini
              </p>
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[11px] text-muted-foreground">Masuk</p>
                <p className="text-sm font-semibold text-[color:var(--success)]">
                  {formatIDR(cashIn)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Keluar</p>
                <p className="text-sm font-semibold text-destructive">
                  {formatIDR(cashOut)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Laba</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    cashIn - cashOut < 0
                      ? "text-destructive"
                      : "text-[color:var(--success)]",
                  )}
                >
                  {formatIDR(cashIn - cashOut)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Timer kesegaran bahan (review 2026-07-06) */}
      {staleIngredients.length > 0 && (
        <Card className="border-[color:var(--warning)]/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="size-5 text-warning" />
              Cek Kesegaran Bahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {staleIngredients.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/bahan/${i.id}`}
                    className="flex items-center justify-between py-2.5 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        umur {i.ageDays} hari sejak beli terakhir · masa segar{" "}
                        {i.shelfDays} hari
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Cek fisik bahan-bahan ini; bila rusak, catat lewat{" "}
              <Link href="/opname" className="font-medium text-primary underline">
                Stock Opname
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produk Terlaris (bulan ini)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topProducts.map(([name, qty], i) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                      {i + 1}
                    </span>
                    {name}
                  </span>
                  <span className="font-medium">{formatNumber(qty)} terjual</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Low stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-5 text-warning" />
            Stok Menipis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowProducts.length === 0 && lowIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada stok yang menipis. 👍</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowProducts.map((p) => (
                <LowRow key={p.id} href={`/produk/${p.id}`} name={p.name} qty={Number(p.stock_qty)} min={Number(p.min_stock)} unit={p.unit} tag="Produk" />
              ))}
              {lowIngredients.map((i) => (
                <LowRow key={i.id} href={`/bahan/${i.id}`} name={i.name} qty={Number(i.stock_qty)} min={Number(i.min_stock)} unit={i.unit} tag="Bahan" />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <Card
      className={cn(
        "relative overflow-hidden",
        href && "savo-lift hover:border-primary/40",
      )}
    >
      {/* soft ember glow in the corner */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-primary/[0.06] blur-2xl" />
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/10">
            {icon}
          </div>
        </div>
        <p className="font-serif text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function LowRow({
  href,
  name,
  qty,
  min,
  unit,
  tag,
}: {
  href: string;
  name: string;
  qty: number;
  min: number;
  unit: string;
  tag: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between py-2.5 hover:opacity-80">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5">{tag}</span> sisa{" "}
            {formatQty(qty, unit)} · min {formatQty(min, unit)}
          </p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
