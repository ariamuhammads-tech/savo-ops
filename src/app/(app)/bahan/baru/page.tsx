import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { IngredientForm } from "../ingredient-form";
import { createIngredient } from "../actions";
import { Card, CardContent } from "@/components/ui/card";

export default function BahanBaruPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/bahan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Tambah Bahan Baku
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <IngredientForm action={createIngredient} />
        </CardContent>
      </Card>
    </div>
  );
}
