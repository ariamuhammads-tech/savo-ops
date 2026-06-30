import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "../product-form";
import { createProduct } from "../actions";
import { Card, CardContent } from "@/components/ui/card";

export default function ProdukBaruPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/produk"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <h1 className="font-serif text-2xl font-bold tracking-tight">
        Tambah Produk
      </h1>

      <Card>
        <CardContent className="pt-6">
          <ProductForm action={createProduct} />
        </CardContent>
      </Card>
    </div>
  );
}
