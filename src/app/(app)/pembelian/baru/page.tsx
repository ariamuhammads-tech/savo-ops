import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PurchaseBuilder } from "../purchase-builder";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PembelianBaruPage() {
  const supabase = await createClient();
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, last_unit_cost")
    .order("name");

  const today = formatDate(new Date(), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/pembelian"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-serif text-2xl font-bold tracking-tight">Catat Pembelian</h1>

      {!ingredients || ingredients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada bahan baku. Tambahkan dulu di menu{" "}
            <Link href="/bahan" className="font-medium text-primary underline">
              Bahan Baku
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <PurchaseBuilder
          ingredients={ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            last_unit_cost: Number(i.last_unit_cost),
          }))}
          defaultDate={today}
        />
      )}
    </div>
  );
}
