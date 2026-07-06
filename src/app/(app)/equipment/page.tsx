import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Wrench, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import { effectiveUnitCost } from "@/lib/hpp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const metadata: Metadata = { title: "Equipment · SAVO Ops" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["Equipment", "Tools", "Consumable", "Kelengkapan"];

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("equipment").select("*").order("name");
  const all = data ?? [];

  // Nilai aset = stok × modal rata-rata (review 2026-07-06: hitungan aset).
  const assetOf = (rows: typeof all) =>
    rows.reduce((s, e) => s + Number(e.stock_qty) * effectiveUnitCost(e), 0);
  const totalAsset = assetOf(all);

  const items = kategori ? all.filter((e) => e.category === kategori) : all;

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
            <Wrench className="size-6 text-primary" />
            Equipment
          </h1>
          <p className="text-sm text-muted-foreground">
            Alat, tools, consumable &amp; kelengkapan — {formatNumber(all.length)} item.
          </p>
        </div>
        <Button asChild>
          <Link href="/equipment/baru">
            <Plus />
            Tambah
          </Link>
        </Button>
      </div>

      {/* Nilai aset */}
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total nilai aset</span>
            <span className="font-serif text-xl font-bold text-primary">
              {formatIDR(totalAsset)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <div key={c} className="flex justify-between gap-2">
                <span>{c}</span>
                <span className="font-medium text-foreground">
                  {formatIDR(assetOf(all.filter((e) => e.category === c)))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter kategori */}
      <div className="flex flex-wrap gap-1.5">
        <Chip href="/equipment" active={!kategori} label="Semua" />
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            href={`/equipment?kategori=${encodeURIComponent(c)}`}
            active={kategori === c}
            label={c}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Wrench className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Belum ada item</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Catat alat masak, tools, consumable (sabun, deterjen), dan kelengkapan
            kirim (packing, sticker, thermobag, dus).
          </p>
          <Button asChild className="mt-2">
            <Link href="/equipment/baru">
              <Plus />
              Tambah item
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((e) => {
            const low =
              Number(e.stock_qty) <= Number(e.min_stock) && Number(e.min_stock) > 0;
            const asset = Number(e.stock_qty) * effectiveUnitCost(e);
            return (
              <Link key={e.id} href={`/equipment/${e.id}`}>
                <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{e.name}</p>
                      <Badge variant="outline">{e.category}</Badge>
                      {low && <Badge variant="warning">Menipis</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Stok {formatNumber(Number(e.stock_qty))} {e.unit}
                      {asset > 0 && <> · aset {formatIDR(asset)}</>}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1.5 text-xs font-medium " +
        (active
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-muted-foreground")
      }
    >
      {label}
    </Link>
  );
}
