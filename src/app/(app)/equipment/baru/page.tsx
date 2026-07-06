import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentForm } from "../equipment-form";
import { createEquipment } from "../actions";

export const metadata: Metadata = { title: "Tambah Equipment · SAVO Ops" };

export default function EquipmentBaruPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah Item</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentForm action={createEquipment} />
        </CardContent>
      </Card>
    </div>
  );
}
