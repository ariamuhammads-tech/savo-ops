"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { canonicalUnit, convertQty, formatQty } from "@/lib/units";
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
type Line = {
  key: number;
  /** Jenis baris: bahan baku atau equipment (review 2026-07-06). */
  itemType: "bahan" | "equipment";
  ingredientId: string; // "" unset, "__new__" for a brand-new bahan, else id
  newName: string;
  newUnit: string;
  qty: string;
  unitCost: string;
  /** Satuan yang dipakai saat MEMBELI — bisa beda dari satuan induk bahan. */
  buyUnit: string;
};

const UNITS = ["g", "kg", "ml", "l", "pcs"];
const NEW = "__new__";

/** Buy-unit choices for a master unit: its weight/volume family, else itself. */
function buyUnitOptions(masterUnit: string): string[] {
  const u = canonicalUnit(masterUnit);
  if (u === "g" || u === "kg") return ["g", "kg"];
  if (u === "ml" || u === "l") return ["ml", "l"];
  return [u || "pcs"];
}
const initial: FormState = { error: null };
let counter = 1;

export function PurchaseBuilder({
  ingredients,
  equipment = [],
  defaultDate,
}: {
  ingredients: IngredientOpt[];
  equipment?: IngredientOpt[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(recordPurchase, initial);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  function addLine() {
    setLines((l) => [
      ...l,
      { key: counter++, itemType: "bahan", ingredientId: "", newName: "", newUnit: "g", qty: "1", unitCost: "0", buyUnit: "" },
    ]);
  }
  function removeLine(key: number) {
    setLines((l) => l.filter((x) => x.key !== key));
  }
  function setItemType(key: number, itemType: "bahan" | "equipment") {
    setLines((l) =>
      l.map((x) =>
        x.key === key ? { ...x, itemType, ingredientId: "", buyUnit: "" } : x,
      ),
    );
  }
  function setIngredient(key: number, ingredientId: string) {
    setLines((l) =>
      l.map((x) => {
        if (x.key !== key) return x;
        const list = x.itemType === "equipment" ? equipment : ingredients;
        const ing = list.find((o) => o.id === ingredientId);
        return {
          ...x,
          ingredientId,
          unitCost: ing ? String(ing.last_unit_cost) : x.unitCost,
          // default: beli dalam satuan induk item
          buyUnit: ing ? canonicalUnit(ing.unit) : "",
        };
      }),
    );
  }
  function setField(
    key: number,
    field: "qty" | "unitCost" | "newName" | "newUnit" | "buyUnit",
    value: string,
  ) {
    setLines((l) => l.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }

  const total = useMemo(
    () => lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unitCost || 0), 0),
    [lines],
  );

  const itemsPayload = JSON.stringify(
    lines
      .filter(
        (l) =>
          Number(l.qty) > 0 &&
          (l.ingredientId === NEW ? l.newName.trim() : l.ingredientId),
      )
      .map((l) => {
        if (l.itemType === "equipment") {
          const eq = equipment.find((x) => x.id === l.ingredientId);
          return {
            item_type: "equipment",
            ingredient_id: null,
            equipment_id: l.ingredientId,
            name: eq?.name ?? "",
            unit: eq?.unit ?? null,
            buy_unit: l.buyUnit || canonicalUnit(eq?.unit ?? ""),
            qty: Number(l.qty),
            unit_cost: Number(l.unitCost),
          };
        }
        if (l.ingredientId === NEW) {
          return {
            item_type: "bahan",
            ingredient_id: null,
            name: l.newName.trim(),
            unit: l.newUnit,
            qty: Number(l.qty),
            unit_cost: Number(l.unitCost),
          };
        }
        const ing = ingredients.find((x) => x.id === l.ingredientId);
        return {
          item_type: "bahan",
          ingredient_id: l.ingredientId,
          name: ing?.name ?? "",
          unit: ing?.unit ?? null,
          buy_unit: l.buyUnit || canonicalUnit(ing?.unit ?? ""),
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
            const isEquip = l.itemType === "equipment";
            const isNew = !isEquip && l.ingredientId === NEW;
            const list = isEquip ? equipment : ingredients;
            const ing = list.find((x) => x.id === l.ingredientId);
            const masterUnit = isNew ? l.newUnit : canonicalUnit(ing?.unit ?? "");
            const unitChoices = isNew ? [l.newUnit] : buyUnitOptions(masterUnit);
            const buyUnit = isNew ? l.newUnit : l.buyUnit || masterUnit;
            const unitLabel = buyUnit || "satuan";
            const lineTotal = Number(l.qty || 0) * Number(l.unitCost || 0);
            // Preview konversi ke satuan induk bila satuan beli berbeda.
            const qtyMaster =
              !isNew && ing && buyUnit !== masterUnit
                ? convertQty(Number(l.qty || 0), buyUnit, masterUnit)
                : null;
            return (
              <div key={l.key} className="rounded-lg border border-border p-3">
                {/* Jenis baris */}
                <div className="mb-2 flex gap-1.5">
                  {(["bahan", "equipment"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setItemType(l.key, t)}
                      className={
                        "rounded-full border px-3 py-1 text-xs font-medium " +
                        (l.itemType === t
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground")
                      }
                    >
                      {t === "bahan" ? "Bahan Baku" : "Equipment"}
                    </button>
                  ))}
                </div>
                <div className="mb-2 flex items-start gap-2">
                  <Select value={l.ingredientId} onChange={(e) => setIngredient(l.key, e.target.value)} className="flex-1">
                    <option value="" disabled>
                      {isEquip ? "— Pilih item equipment —" : "— Pilih bahan —"}
                    </option>
                    {list.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                    {!isEquip && <option value={NEW}>＋ Bahan baru…</option>}
                  </Select>
                  <button type="button" onClick={() => removeLine(l.key)} className="rounded-md p-2 text-muted-foreground hover:text-destructive" aria-label="Hapus">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {isEquip && equipment.length === 0 && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Belum ada item equipment — tambahkan dulu di menu Equipment.
                  </p>
                )}

                {isNew && (
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Nama bahan baru</Label>
                      <Input value={l.newName} onChange={(e) => setField(l.key, "newName", e.target.value)} placeholder="mis. Tepung terigu" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Satuan</Label>
                      <Select value={l.newUnit} onChange={(e) => setField(l.key, "newUnit", e.target.value)}>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Jumlah</Label>
                    <Input type="number" inputMode="decimal" min="0" step="any" value={l.qty} onChange={(e) => setField(l.key, "qty", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Satuan beli</Label>
                    {unitChoices.length > 1 ? (
                      <Select value={buyUnit} onChange={(e) => setField(l.key, "buyUnit", e.target.value)}>
                        {unitChoices.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </Select>
                    ) : (
                      <div className="flex h-11 items-center rounded-lg border border-border/70 bg-secondary/40 px-3.5 text-sm text-muted-foreground">
                        {unitLabel}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga / {unitLabel}</Label>
                    <Input type="number" inputMode="numeric" min="0" step="any" value={l.unitCost} onChange={(e) => setField(l.key, "unitCost", e.target.value)} />
                  </div>
                </div>
                <p className="mt-2 text-right text-sm text-muted-foreground">
                  {qtyMaster !== null && qtyMaster !== undefined && (
                    <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-xs">
                      = {formatQty(qtyMaster, masterUnit)} (satuan induk)
                    </span>
                  )}
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
        memperbarui harga beli terakhir. <span className="font-medium">Bahan baru</span> otomatis
        ditambahkan ke menu Bahan Baku.
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
