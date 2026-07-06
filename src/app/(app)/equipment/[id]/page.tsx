import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Equipment } from "@/lib/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentForm, EquipmentDeleteForm } from "../equipment-form";
import { updateEquipment } from "../actions";

export const metadata: Metadata = { title: "Detail Equipment · SAVO Ops" };
export const dynamic = "force-dynamic";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("equipment").select("*").eq("id", id).single();
  if (!data) notFound();
  const item = data as Equipment;

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
          <CardTitle className="text-base">Detail Item</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentForm action={updateEquipment} item={item} />
        </CardContent>
      </Card>
      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <p className="text-sm font-medium">Hapus item ini</p>
          <EquipmentDeleteForm item={item} />
        </CardContent>
      </Card>
    </div>
  );
}
