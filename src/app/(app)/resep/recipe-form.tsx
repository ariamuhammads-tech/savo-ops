"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import type { FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProductOption = { id: string; name: string; unit: string };
type RecipeDefaults = {
  id: string;
  product_id: string;
  name: string;
  yield_qty: number;
  yield_unit: string | null;
  overhead_cost: number;
  notes: string | null;
};

const initial: FormState = { error: null };

export function RecipeForm({
  action,
  products,
  recipe,
  productName,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  products?: ProductOption[];
  recipe?: RecipeDefaults;
  productName?: string;
}) {
  const [state, formAction] = useActionState(action, initial);
  const isEdit = !!recipe;

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={recipe.id} />}

      {isEdit ? (
        <>
          <input type="hidden" name="product_id" value={recipe.product_id} />
          <div className="space-y-1">
            <Label>Produk</Label>
            <p className="rounded-md bg-secondary px-3 py-2 text-sm font-medium">
              {productName}
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="product_id">Produk *</Label>
          <Select id="product_id" name="product_id" defaultValue="" required>
            <option value="" disabled>
              — Pilih produk —
            </option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Review 2026-07-06: nama resep mengikuti varian/SKU produk — bukan teks
          bebas. Varian baru = tambah SKU di menu Produk, lalu buat resepnya. */}
      <input type="hidden" name="name" value={recipe?.name ?? "Resep Standar"} />
      {!isEdit && (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          Satu produk (SKU) = satu resep standar. Untuk varian baru (mis. rasa
          lain), tambah SKU-nya dulu di menu <b>Produk</b>, lalu buat resep untuk
          SKU tersebut.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="yield_qty">Hasil / batch *</Label>
          <Input
            id="yield_qty"
            name="yield_qty"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={recipe?.yield_qty ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yield_unit">Satuan hasil</Label>
          <Input
            id="yield_unit"
            name="yield_unit"
            defaultValue={recipe?.yield_unit ?? "pack"}
            placeholder="pack"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="overhead_cost">Biaya overhead / batch (Rp)</Label>
        <Input
          id="overhead_cost"
          name="overhead_cost"
          type="number"
          inputMode="numeric"
          min="0"
          step="any"
          defaultValue={recipe?.overhead_cost ?? 0}
        />
        <p className="text-xs text-muted-foreground">
          Opsional: biaya tenaga/listrik/gas per batch, ditambahkan ke HPP.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" name="notes" defaultValue={recipe?.notes ?? ""} />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <SubmitButton icon={Save} pendingText="Menyimpan…" className="w-full sm:w-auto">
        {isEdit ? "Simpan perubahan" : "Buat resep & tambah bahan"}
      </SubmitButton>
    </form>
  );
}
