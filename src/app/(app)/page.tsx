import Link from "next/link";
import { Package, Wheat, TriangleAlert, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: ingredients }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, unit, stock_qty, min_stock, is_active"),
    supabase
      .from("ingredients")
      .select("id, name, unit, stock_qty, min_stock"),
  ]);

  const lowProducts = (products ?? []).filter(
    (p) => Number(p.stock_qty) <= Number(p.min_stock) && Number(p.min_stock) > 0,
  );
  const lowIngredients = (ingredients ?? []).filter(
    (i) => Number(i.stock_qty) <= Number(i.min_stock) && Number(i.min_stock) > 0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional SAVO.
        </p>
      </div>

      {/* Quick counts */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          href="/produk"
          icon={<Package className="size-5 text-primary" />}
          label="Produk"
          value={formatNumber(products?.length ?? 0)}
        />
        <StatCard
          href="/bahan"
          icon={<Wheat className="size-5 text-primary" />}
          label="Bahan Baku"
          value={formatNumber(ingredients?.length ?? 0)}
        />
      </div>

      {/* Low stock alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-5 text-warning" />
            Stok Menipis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowProducts.length === 0 && lowIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada stok yang menipis. 👍
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lowProducts.map((p) => (
                <LowRow
                  key={p.id}
                  name={p.name}
                  qty={Number(p.stock_qty)}
                  min={Number(p.min_stock)}
                  unit={p.unit}
                  tag="Produk"
                />
              ))}
              {lowIngredients.map((i) => (
                <LowRow
                  key={i.id}
                  name={i.name}
                  qty={Number(i.stock_qty)}
                  min={Number(i.min_stock)}
                  unit={i.unit}
                  tag="Bahan"
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        KPI penjualan & invoice akan muncul di sini setelah modul Pesanan aktif.
      </p>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-serif text-2xl font-bold">{value}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
            {icon}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LowRow({
  name,
  qty,
  min,
  unit,
  tag,
}: {
  name: string;
  qty: number;
  min: number;
  unit: string;
  tag: string;
}) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-1.5 py-0.5">{tag}</span>{" "}
          sisa {formatNumber(qty, 0)} {unit} · min {formatNumber(min, 0)} {unit}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </li>
  );
}
