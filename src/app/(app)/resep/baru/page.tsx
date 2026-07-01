import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { RecipeForm } from "../recipe-form";
import { createRecipe } from "../actions";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ResepBaruPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, unit")
    .order("name");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/resep"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-serif text-2xl font-bold tracking-tight">Buat Resep</h1>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada produk. Tambahkan produk dulu di menu{" "}
            <Link href="/produk" className="font-medium text-primary underline">
              Produk
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <RecipeForm action={createRecipe} products={products} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
