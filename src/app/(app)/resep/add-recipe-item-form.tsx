"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { addRecipeItem } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  last_unit_cost: number;
};

const UNITS = ["g", "kg", "ml", "l", "pcs"];
const NEW = "__new__";

export function AddRecipeItemForm({
  recipeId,
  ingredients,
}: {
  recipeId: string;
  ingredients: IngredientOption[];
}) {
  const [ingredientId, setIngredientId] = useState("");
  const [qty, setQty] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("g");

  const isNew = ingredientId === NEW;
  const selected = useMemo(
    () => ingredients.find((i) => i.id === ingredientId),
    [ingredients, ingredientId],
  );
  const unitLabel = isNew ? newUnit : selected?.unit ?? "";
  const subtotal =
    selected && qty ? Number(qty) * Number(selected.last_unit_cost) : 0;

  return (
    <form action={addRecipeItem} className="space-y-3">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="unit" value={isNew ? newUnit : selected?.unit ?? ""} />
      <input type="hidden" name="new_name" value={isNew ? newName : ""} />
      <input type="hidden" name="new_unit" value={isNew ? newUnit : ""} />
      {!isNew && <input type="hidden" name="ingredient_id" value={ingredientId} />}

      <div className="space-y-2">
        <Label htmlFor="ingredient_id">Bahan</Label>
        <Select
          id="ingredient_id"
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
          required
        >
          <option value="" disabled>
            — Pilih bahan —
          </option>
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({formatIDR(Number(i.last_unit_cost))}/{i.unit})
            </option>
          ))}
          <option value={NEW}>＋ Bahan baru…</option>
        </Select>
      </div>

      {isNew && (
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Nama bahan baru</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="mis. Tepung terigu" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Satuan</Label>
            <Select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="quantity">Jumlah {unitLabel ? `(${unitLabel})` : ""}</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="mis. 100"
            required
          />
        </div>
        <SubmitButton icon={Plus} className="shrink-0">
          Tambah
        </SubmitButton>
      </div>

      {isNew ? (
        <p className="text-xs text-muted-foreground">
          Bahan baru otomatis ditambahkan ke menu Bahan Baku.
        </p>
      ) : (
        selected &&
        qty !== "" && (
          <p className="text-sm text-muted-foreground">
            Biaya: {Number(qty || 0)} × {formatIDR(Number(selected.last_unit_cost))} ={" "}
            <span className="font-medium text-foreground">{formatIDR(subtotal)}</span>
          </p>
        )
      )}
    </form>
  );
}
