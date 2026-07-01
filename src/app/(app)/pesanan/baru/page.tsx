import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { OrderBuilder } from "../order-builder";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PesananBaruPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("id, name, price_tier, type").order("name"),
    supabase
      .from("products")
      .select("id, name, price_b2c, price_b2b, unit, stock_qty")
      .eq("is_active", true)
      .order("name"),
  ]);

  const today = formatDate(new Date(), "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/pesanan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-serif text-2xl font-bold tracking-tight">Pesanan Baru</h1>

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada produk aktif. Tambahkan produk dulu di menu{" "}
            <Link href="/produk" className="font-medium text-primary underline">
              Produk
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <OrderBuilder
          customers={(customers ?? []) as never}
          products={products as never}
          defaultDate={today}
        />
      )}
    </div>
  );
}
