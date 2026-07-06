import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { effectiveUnitCost } from "@/lib/hpp";
import { OpnameForm, type OpnameIngredient } from "./opname-form";

export const metadata: Metadata = { title: "Stock Opname · SAVO Ops" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function OpnamePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name, unit, stock_qty, last_unit_cost, avg_unit_cost")
    .order("name");

  const ingredients: OpnameIngredient[] = (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    stock: Number(i.stock_qty),
    unitCost: effectiveUnitCost(i),
  }));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
          <ClipboardCheck className="size-6 text-primary" />
          Stock Opname
        </h1>
        <p className="text-sm text-muted-foreground">
          Hitung fisik stok bahan, isi angka aktualnya, dan pilih alasan bila ada
          selisih. Nilai penyusutan otomatis dibukukan ke Keuangan.
        </p>
      </div>
      <OpnameForm ingredients={ingredients} />
    </div>
  );
}
