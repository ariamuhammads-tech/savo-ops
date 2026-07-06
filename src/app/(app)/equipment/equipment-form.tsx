"use client";

import { useActionState } from "react";
import { Save, Trash2 } from "lucide-react";

import type { Equipment } from "@/lib/database.types";
import type { FormState } from "./actions";
import { deleteEquipment } from "./actions";
import { SubmitButton, ConfirmSubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = ["Equipment", "Tools", "Consumable", "Kelengkapan"];
const UNITS = ["pcs", "set", "pack", "roll", "botol", "kg", "l"];

const initial: FormState = { error: null };

export function EquipmentForm({
  action,
  item,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  item?: Equipment;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nama item *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item?.name ?? ""}
          placeholder="mis. Thermobag besar / Sabun cuci piring"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select id="category" name="category" defaultValue={item?.category ?? "Equipment"}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Satuan</Label>
          <Select id="unit" name="unit" defaultValue={item?.unit ?? "pcs"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Equipment = alat besar (kulkas, freezer) · Tools = alat kecil (pisau,
        talenan) · Consumable = habis pakai (deterjen, sabun) · Kelengkapan =
        packing, sticker, plastik, thermobag, dus kirim.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="stock_qty">Stok</Label>
          <Input
            id="stock_qty"
            name="stock_qty"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={item?.stock_qty ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_stock">Minimum</Label>
          <Input
            id="min_stock"
            name="min_stock"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            defaultValue={item?.min_stock ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_unit_cost">Harga (Rp)</Label>
          <Input
            id="last_unit_cost"
            name="last_unit_cost"
            type="number"
            inputMode="numeric"
            min="0"
            step="any"
            defaultValue={item?.last_unit_cost ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" name="notes" defaultValue={item?.notes ?? ""} />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="pt-2">
        <SubmitButton pendingText="Menyimpan…" className="w-full sm:w-auto">
          <Save />
          Simpan
        </SubmitButton>
      </div>
    </form>
  );
}

/** Tombol hapus terpisah (form sendiri — tidak boleh bersarang). */
export function EquipmentDeleteForm({ item }: { item: Equipment }) {
  return (
    <form action={deleteEquipment}>
      <input type="hidden" name="id" value={item.id} />
      <ConfirmSubmitButton
        variant="destructive"
        confirmText={`Hapus "${item.name}"? Tindakan ini tidak bisa dibatalkan.`}
      >
        <Trash2 />
        Hapus
      </ConfirmSubmitButton>
    </form>
  );
}
