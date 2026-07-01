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

export function AddRecipeItemForm({
  recipeId,
  ingredients,
}: {
  recipeId: string;
  ingredients: IngredientOption[];
}) {
  const [ingredientId, setIngredientId] = useState("");
  const [qty, setQty] = useState("");

  const selected = useMemo(
    () => ingredients.find((i) => i.id === ingredientId),
    [ingredients, ingredientId],
  );
  const subtotal =
    selected && qty ? Number(qty) * Number(selected.last_unit_cost) : 0;

  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada bahan baku. Tambahkan dulu di menu Bahan Baku.
      </p>
    );
  }

  return (
    <form action={addRecipeItem} className="space-y-3">
      <input type="hidden" name="recipe_id" value={recipeId} />
      <input type="hidden" name="unit" value={selected?.unit ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="ingredient_id">Bahan</Label>
        <Select
          id="ingredient_id"
          name="ingredient_id"
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
        </Select>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="quantity">
            Jumlah {selected ? `(${selected.unit})` : ""}
          </Label>
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

      {selected && qty !== "" && (
        <p className="text-sm text-muted-foreground">
          Biaya: {Number(qty || 0)} × {formatIDR(Number(selected.last_unit_cost))}{" "}
          = <span className="font-medium text-foreground">{formatIDR(subtotal)}</span>
        </p>
      )}
    </form>
  );
}
