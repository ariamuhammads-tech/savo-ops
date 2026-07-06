import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { DokumenBuilder, type ProductOpt, type BuilderItem } from "./dokumen-builder";

export const metadata: Metadata = { title: "Generator Dokumen · SAVO Ops" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function DokumenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ jenis?: string }>;
}) {
  const { id } = await params;
  const { jenis } = await searchParams;
  const supabase = await createClient();

  const [{ data: order }, { data: products }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_no, discount, shipping, tax, customer:customers(price_tier), order_items(name, qty, unit_price)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("products")
      .select("id, name, price_b2c, price_b2b")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!order) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any;

  const initialItems: BuilderItem[] = (o.order_items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (it: any) => ({
      name: it.name ?? "",
      qty: Number(it.qty),
      unit_price: Number(it.unit_price),
    }),
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href={`/pesanan/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Pesanan {o.order_no}
      </Link>

      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight">
          <FileText className="size-6 text-primary" />
          Generator Dokumen
        </h1>
        <p className="text-sm text-muted-foreground">
          Susun isi dokumen bebas dari pesanan ini — produk, qty, harga, promo,
          dan DP bisa diubah tanpa mengubah pesanan aslinya.
        </p>
      </div>

      <DokumenBuilder
        orderId={id}
        products={(products ?? []) as ProductOpt[]}
        initialItems={initialItems}
        defaultJenis={jenis ?? "penawaran"}
        priceTier={o.customer?.price_tier === "b2b" ? "b2b" : "b2c"}
        orderMeta={{
          discount: Number(o.discount ?? 0),
          shipping: Number(o.shipping ?? 0),
          tax: Number(o.tax ?? 0),
        }}
      />
    </div>
  );
}
