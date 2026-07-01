import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2, MessageCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CustomerForm } from "../customer-form";
import { updateCustomer, deleteCustomer } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/form-buttons";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

export default async function PelangganEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const waDigits = (customer.phone_wa ?? "").replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <Link
        href="/pelanggan"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {customer.name}
        </h1>
        <Badge variant={customer.type === "b2b" ? "primary" : "outline"}>
          {customer.type.toUpperCase()}
        </Badge>
      </div>

      {waDigits && (
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Chat WhatsApp
          </a>
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm action={updateCustomer} customer={customer} />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Hapus pelanggan ini</p>
            <p className="text-sm text-muted-foreground">
              Data pelanggan akan dihapus permanen.
            </p>
          </div>
          <form action={deleteCustomer}>
            <input type="hidden" name="id" value={customer.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmText={`Hapus "${customer.name}"? Tindakan ini tidak bisa dibatalkan.`}
            >
              <Trash2 />
              Hapus
            </ConfirmSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
