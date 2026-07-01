"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { recordPurchase, type FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type IngredientOpt = {
  id: string;
  name: string;
  unit: string;
  last_unit_cost: number;
};
type Line = { key: number; ingredientId: string; qty: string; unitCost: string };

const initial: FormState = { error: null };
let counter = 1;

export function PurchaseBuilder({
  ingredients,
  defaultDate,
}: {
  ingredients: IngredientOpt[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(recordPurchase, initial);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  function addLine() {
    setLines((l) => [...l, { key: counter++, ingredientId: "", qty: "1", unitCost: "0" }]);
  }
  function removeLine(key: number) {
    setLines((l) => l.filter((x) => x.key !== key));
  }
  function setIngredient(key: number, ingredientId: string) {
    const ing = ingredients.find((x) => x.id === ingredientId);
    setLines((l) =>
      l.map((x) =>
        x.key === key
          ? { ...x, ingredientId, unitCost: ing ? String(ing.last_unit_cost) : x.unitCost }
          : x,
      ),
    );
  }
  function setField(key: number, field: "qty" | "unitCost", value: string) {
    setLines((l) => l.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }

  const total = useMemo(
    () => lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unitCost || 0), 0),
    [lines],
  );

  const itemsPayload = JSON.stringify(
    lines
      .filter((l) => l.ingredientId && Number(l.qty) > 0)
      .map((l) => {
        const ing = ingredients.find((x) => x.id === l.ingredientId);
        return {
          ingredient_id: l.ingredientId,
          name: ing?.name ?? "",
          qty: Number(l.qty),
          unit_cost: Number(l.unitCost),
        };
      }),
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="items" value={itemsPayload} />
      <input type="hidden" name="supplier_name" value={supplier} />
      <input type="hidden" name="purchase_date" value={date} />
      <input type="hidden" name="notes" value={notes} />

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 pt-6">
          <div className="space-y-2">
            <Label htmlFor="supplier">Pemasok</Label>
            <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="mis. Toko Bahan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Tanggal</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <p className="font-medium">Bahan dibeli</p>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-sm font-medium hover:bg-secondary/70"
            >
              <Plus className="size-4" />
              Tambah
            </button>
          </div>

          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada bahan. Ketuk “Tambah”.</p>
          )}

          {lines.map((l) => {
            const ing = ingredients.find((x) => x.id === l.ingredientId);
            const lineTotal = Number(l.qty || 0) * Number(l.unitCost || 0);
            return (
              <div key={l.key} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-start gap-2">
                  <Select value={l.ingredientId} onChange={(e) => setIngredient(l.key, e.target.value)} className="flex-1">
                    <option value="" disabled>
                      — Pilih bahan —
                    </option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>
                  <button type="button" onClick={() => removeLine(l.key)} className="rounded-md p-2 text-muted-foreground hover:text-destructive" aria-label="Hapus">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Jumlah {ing ? `(${ing.unit})` : ""}</Label>
                    <Input type="number" inputMode="decimal" min="0" step="any" value={l.qty} onChange={(e) => setField(l.key, "qty", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga / {ing?.unit ?? "satuan"}</Label>
                    <Input type="number" inputMode="numeric" min="0" step="any" value={l.unitCost} onChange={(e) => setField(l.key, "unitCost", e.target.value)} />
                  </div>
                </div>
                <p className="mt-2 text-right text-sm text-muted-foreground">
                  Subtotal: <span className="font-medium text-foreground">{formatIDR(lineTotal)}</span>
                </p>
              </div>
            );
          })}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="font-serif text-xl font-bold text-primary">{formatIDR(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        Menyimpan pembelian akan <span className="font-medium">menambah stok bahan</span> dan
        memperbarui harga beli terakhir (dipakai untuk HPP).
      </p>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton icon={ShoppingBag} pendingText="Menyimpan…" className="w-full">
        Simpan Pembelian
      </SubmitButton>
    </form>
  );
}
