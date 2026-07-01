"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, ChevronRight } from "lucide-react";

import type { Customer } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CustomerList({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.business_name, c.phone_wa, c.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [customers, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length}
            {q ? ` / ${customers.length}` : ""} pelanggan
          </p>
        </div>
        <Button asChild>
          <Link href="/pelanggan/baru">
            <Plus />
            Tambah
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, bisnis, atau nomor HP…"
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {customers.length === 0 ? "Belum ada pelanggan" : "Tidak ditemukan"}
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {customers.length === 0
              ? "Tambahkan pelanggan B2C (perorangan) atau B2B (kafe/resto)."
              : "Coba kata kunci lain."}
          </p>
          {customers.length === 0 && (
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
          {filtered.map((c) => (
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
