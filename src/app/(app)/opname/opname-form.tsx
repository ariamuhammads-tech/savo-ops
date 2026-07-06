"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";
import { formatQty } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applyOpname } from "./actions";

const REASONS = [
  "Rusak / kedaluwarsa",
  "Susut / tumpah",
  "Salah catat",
  "Hilang",
  "Lainnya",
];

export type OpnameIngredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  unitCost: number;
};

type Entry = { actual: string; reason: string };

export function OpnameForm({ ingredients }: { ingredients: OpnameIngredient[] }) {
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(needle));
  }, [ingredients, q]);

  const set = (id: string, patch: Partial<Entry>) =>
    setEntries((prev) => {
      const base: Entry = prev[id] ?? { actual: "", reason: REASONS[0] };
      return { ...prev, [id]: { ...base, ...patch } };
    });

  // Rows the user actually counted AND that differ from system stock.
  const changes = ingredients
    .map((i) => {
      const e = entries[i.id];
      if (!e || e.actual === "") return null;
      const actual = Number(e.actual.replace(",", "."));
      if (!Number.isFinite(actual) || actual < 0) return null;
      const diff = actual - i.stock;
      if (diff === 0) return null;
      return { ing: i, actual, diff, reason: e.reason ?? REASONS[0] };
    })
    .filter(Boolean) as { ing: OpnameIngredient; actual: number; diff: number; reason: string }[];

  const totalLoss = changes
    .filter((c) => c.diff < 0)
    .reduce((s, c) => s + Math.abs(c.diff) * c.ing.unitCost, 0);

  function submit() {
    if (changes.length === 0) {
      toast.error("Belum ada selisih yang perlu disimpan.");
      return;
    }
    const lines = changes
      .map((c) => `• ${c.ing.name}: ${formatQty(c.ing.stock, c.ing.unit)} → ${formatQty(c.actual, c.ing.unit)}`)
      .join("\n");
    if (
      !window.confirm(
        `Simpan opname untuk ${changes.length} bahan?\n\n${lines}\n\n` +
          (totalLoss > 0
            ? `Nilai penyusutan ${formatIDR(totalLoss)} akan dicatat sebagai pengeluaran "Selisih Opname" di Keuangan.`
            : "Tidak ada penyusutan bernilai."),
      )
    )
      return;
    startTransition(async () => {
      const res = await applyOpname(
        changes.map((c) => ({ id: c.ing.id, actual: c.actual, reason: c.reason })),
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.adjusted} bahan disesuaikan.` +
          (res.lossValue > 0 ? ` Penyusutan ${formatIDR(res.lossValue)} dicatat di Keuangan.` : ""),
      );
      setEntries({});
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari bahan…"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((i) => {
          const e = entries[i.id];
          const actual = e && e.actual !== "" ? Number(e.actual.replace(",", ".")) : null;
          const diff = actual !== null && Number.isFinite(actual) ? actual - i.stock : null;
          return (
            <Card key={i.id} className={cn("p-3.5", diff ? "border-primary/40" : "")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Sistem: {formatQty(i.stock, i.unit)}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder={`aktual (${i.unit})`}
                    value={e?.actual ?? ""}
                    onChange={(ev) => set(i.id, { actual: ev.target.value })}
                    className="h-10 text-right"
                  />
                </div>
              </div>
              {diff !== null && diff !== 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      diff < 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-[color:var(--success)]/10 text-[color:var(--success)]",
                    )}
                  >
                    {diff < 0 ? "−" : "+"}
                    {formatQty(Math.abs(diff), i.unit)}
                    {diff < 0 && i.unitCost > 0 && (
                      <> · {formatIDR(Math.abs(diff) * i.unitCost)}</>
                    )}
                  </span>
                  <div className="min-w-40 flex-1">
                    <Select
                      value={e?.reason ?? REASONS[0]}
                      onChange={(ev) => set(i.id, { reason: ev.target.value })}
                      className="h-10"
                    >
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada bahan yang cocok dengan pencarian.
          </p>
        )}
      </div>

      {/* Sticky summary + submit */}
      <div className="sticky bottom-20 md:bottom-4">
        <Card className="flex items-center justify-between gap-3 p-3.5 shadow-[var(--shadow-pop)]">
          <div className="text-sm">
            <p className="font-medium">{changes.length} bahan ada selisih</p>
            <p className="text-xs text-muted-foreground">
              {totalLoss > 0
                ? `Penyusutan ${formatIDR(totalLoss)} → dicatat ke Keuangan`
                : "Tidak ada penyusutan bernilai"}
            </p>
          </div>
          <Button onClick={submit} disabled={pending || changes.length === 0}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                Menyimpan…
              </>
            ) : (
              <>
                <ClipboardCheck />
                Simpan Opname
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
