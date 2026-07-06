import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Wheat, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import { formatQty } from "@/lib/units";
import { effectiveUnitCost } from "@/lib/hpp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Bahan Mentah",
  "Bumbu Kering",
  "Bumbu Basah",
  "Bahan Setengah Jadi",
];

export default async function BahanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("ingredients").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (kategori === "lainnya") query = query.is("category", null);
  else if (kategori) query = query.eq("category", kategori);
  const { data: ingredients } = await query;

  const chipHref = (k: string) =>
    `/bahan?${new URLSearchParams({ ...(q ? { q } : {}), ...(k ? { kategori: k } : {}) }).toString()}`;

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Bahan Baku
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(ingredients?.length ?? 0)} bahan
          </p>
        </div>
        <Button asChild>
          <Link href="/bahan/baru">
            <Plus />
            Tambah
          </Link>
        </Button>
      </div>

      <form className="relative">
        {kategori && <input type="hidden" name="kategori" value={kategori} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari bahan…"
          className="pl-9"
        />
      </form>

      {/* Filter kategori (review 2026-07-06) */}
      <div className="flex flex-wrap gap-1.5">
        <CategoryChip href={chipHref("")} active={!kategori} label="Semua" />
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} href={chipHref(c)} active={kategori === c} label={c} />
        ))}
        <CategoryChip
          href={chipHref("lainnya")}
          active={kategori === "lainnya"}
          label="Belum dikategorikan"
        />
      </div>

      {!ingredients || ingredients.length === 0 ? (
        <EmptyState hasQuery={!!q} />
      ) : (
        <div className="space-y-2">
          {ingredients.map((item) => {
            const low =
              Number(item.stock_qty) <= Number(item.min_stock) &&
              Number(item.min_stock) > 0;
            return (
              <Link key={item.id} href={`/bahan/${item.id}`}>
                <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{item.name}</p>
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                      {low && <Badge variant="warning">Menipis</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Stok {formatQty(Number(item.stock_qty), item.unit)}
                      {effectiveUnitCost(item) > 0 && (
                        <> · modal {formatIDR(effectiveUnitCost(item))}/{item.unit}</>
                      )}
                      {Number(item.last_unit_cost) > 0 &&
                        Math.round(Number(item.last_unit_cost)) !==
                          Math.round(effectiveUnitCost(item)) && (
                          <> · beli terakhir {formatIDR(Number(item.last_unit_cost))}</>
                        )}
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

function CategoryChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
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

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <Wheat className="size-6 text-muted-foreground" />
      </div>
      <p className="font-medium">
        {hasQuery ? "Bahan tidak ditemukan" : "Belum ada bahan baku"}
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasQuery
          ? "Coba kata kunci lain."
          : "Tambahkan bahan baku seperti daging, bumbu, atau kemasan."}
      </p>
      {!hasQuery && (
        <Button asChild className="mt-2">
          <Link href="/bahan/baru">
            <Plus />
            Tambah bahan
          </Link>
        </Button>
      )}
    </Card>
  );
}
