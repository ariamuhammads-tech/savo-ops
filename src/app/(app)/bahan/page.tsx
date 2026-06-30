import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Wheat, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

export default async function BahanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("ingredients").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: ingredients } = await query;

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
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari bahan…"
          className="pl-9"
        />
      </form>

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
                      {low && <Badge variant="warning">Menipis</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Stok {formatNumber(Number(item.stock_qty))} {item.unit}
                      {Number(item.last_unit_cost) > 0 && (
                        <> · {formatIDR(Number(item.last_unit_cost))}/{item.unit}</>
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
