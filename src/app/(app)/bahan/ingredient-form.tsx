"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import type { Ingredient } from "@/lib/database.types";
import type { FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const UNITS = ["g", "kg", "ml", "l", "pcs"];

const initial: FormState = { error: null };

export function IngredientForm({
  action,
  ingredient,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredient?: Ingredient;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nama bahan *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={ingredient?.name ?? ""}
          placeholder="mis. Daging sapi giling"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Satuan *</Label>
          <Select id="unit" name="unit" defaultValue={ingredient?.unit ?? "g"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_unit_cost">Harga beli / satuan (Rp)</Label>
          <Input
            id="last_unit_cost"
            name="last_unit_cost"
            type="number"
            inputMode="numeric"
            min="0"
            step="any"
            defaultValue={ingredient?.last_unit_cost ?? 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="stock_qty">Stok saat ini</Label>
          <Input
            id="stock_qty"
            name="stock_qty"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={ingredient?.stock_qty ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_stock">Stok minimum</Label>
          <Input
            id="min_stock"
            name="min_stock"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={ingredient?.min_stock ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier_name">Pemasok (opsional)</Label>
        <Input
          id="supplier_name"
          name="supplier_name"
          defaultValue={ingredient?.supplier_name ?? ""}
          placeholder="mis. Toko Daging Jaya"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={ingredient?.notes ?? ""}
          placeholder="Catatan tambahan…"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <SubmitButton icon={Save} pendingText="Menyimpan…" className="flex-1 sm:flex-none">
          Simpan
        </SubmitButton>
      </div>
    </form>
  );
}
