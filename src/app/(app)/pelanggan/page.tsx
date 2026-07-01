import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Users, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FlashToast } from "@/components/flash-toast";

export const dynamic = "force-dynamic";

export default async function PelangganPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("customers").select("*").order("name");
  if (q) query = query.or(`name.ilike.%${q}%,business_name.ilike.%${q}%`);
  const { data: customers } = await query;

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Pelanggan
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(customers?.length ?? 0)} pelanggan
          </p>
        </div>
        <Button asChild>
          <Link href="/pelanggan/baru">
            <Plus />
            Tambah
          </Link>
        </Button>
      </div>

      <form className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama / bisnis…"
          className="pl-9"
        />
      </form>

      {!customers || customers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {q ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {q
              ? "Coba kata kunci lain."
              : "Tambahkan pelanggan B2C (perorangan) atau B2B (kafe/resto)."}
          </p>
          {!q && (
            <Button asChild className="mt-2">
              <Link href="/pelanggan/baru">
                <Plus />
                Tambah pelanggan
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/pelanggan/${c.id}`}>
              <Card className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-primary/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{c.name}</p>
                    <Badge variant={c.type === "b2b" ? "primary" : "outline"}>
                      {c.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {c.business_name ? c.business_name + " · " : ""}
                    {c.phone_wa || "tanpa no. WA"}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
