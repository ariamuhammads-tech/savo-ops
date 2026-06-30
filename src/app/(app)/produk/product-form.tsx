"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import type { Product } from "@/lib/database.types";
import type { FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const UNITS = ["pack", "pcs", "box", "kg"];

const initial: FormState = { error: null };

export function ProductForm({
  action,
  product,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  product?: Product;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nama produk *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name ?? ""}
          placeholder="mis. Sosis Original"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU (opsional)</Label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            placeholder="mis. SO-ORI"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <Input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            placeholder="mis. Sosis, RTH"
            list="kategori-list"
          />
          <datalist id="kategori-list">
            <option value="Sosis" />
            <option value="Bitterballen" />
            <option value="RTH" />
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Satuan *</Label>
          <Select id="unit" name="unit" defaultValue={product?.unit ?? "pack"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight_grams">Berat (gram)</Label>
          <Input
            id="weight_grams"
            name="weight_grams"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={product?.weight_grams ?? ""}
            placeholder="mis. 250"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price_b2c">Harga B2C (Rp)</Label>
          <Input
            id="price_b2c"
            name="price_b2c"
            type="number"
            inputMode="numeric"
            min="0"
            step="any"
            defaultValue={product?.price_b2c ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_b2b">Harga B2B (Rp)</Label>
          <Input
            id="price_b2b"
            name="price_b2b"
            type="number"
            inputMode="numeric"
            min="0"
            step="any"
            defaultValue={product?.price_b2b ?? 0}
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
            defaultValue={product?.stock_qty ?? 0}
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
            defaultValue={product?.min_stock ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={product?.notes ?? ""}
          placeholder="Catatan tambahan…"
        />
      </div>

      <label className="flex items-center gap-2.5 rounded-md border border-input p-3">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={product ? product.is_active : true}
          className="size-4 accent-[color:var(--primary)]"
        />
        <span className="text-sm font-medium">Produk aktif (dijual)</span>
      </label>

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
