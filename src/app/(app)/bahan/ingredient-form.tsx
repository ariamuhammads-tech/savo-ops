"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Save, Lock, PencilLine, ClipboardCheck } from "lucide-react";

import type { Ingredient } from "@/lib/database.types";
import type { FormState } from "./actions";
import { formatQty } from "@/lib/units";
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
  const isEdit = Boolean(ingredient);
  // Master data is locked by default on edit — renaming is a conscious act.
  const [nameUnlocked, setNameUnlocked] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {ingredient && <input type="hidden" name="id" value={ingredient.id} />}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="name">Nama bahan *</Label>
          {isEdit && !nameUnlocked && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Ubah nama bahan? Nama akan berubah di semua resep & riwayat. Lakukan hanya untuk koreksi penulisan — bahan yang berbeda harus dibuat sebagai bahan baru.",
                  )
                )
                  setNameUnlocked(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <PencilLine className="size-3.5" />
              Ubah nama
            </button>
          )}
        </div>
        {isEdit && !nameUnlocked ? (
          <>
            {/* Locked: show value, submit unchanged via hidden input */}
            <div className="flex h-11 items-center gap-2 rounded-lg border border-border/70 bg-secondary/40 px-3.5 text-sm text-muted-foreground">
              <Lock className="size-3.5" />
              {ingredient?.name}
            </div>
            <input type="hidden" name="name" value={ingredient?.name ?? ""} />
          </>
        ) : (
          <Input
            id="name"
            name="name"
            defaultValue={ingredient?.name ?? ""}
            placeholder="mis. Daging sapi giling"
            required
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="unit">Satuan *</Label>
          {isEdit ? (
            <div className="flex h-11 items-center gap-2 rounded-lg border border-border/70 bg-secondary/40 px-3.5 text-sm text-muted-foreground">
              <Lock className="size-3.5" />
              {ingredient?.unit}
            </div>
          ) : (
            <Select id="unit" name="unit" defaultValue="g">
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          )}
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
      {isEdit && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Satuan terkunci agar resep &amp; riwayat stok tetap konsisten. Butuh
          satuan lain? Buat bahan baru.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="stock_qty">Stok saat ini</Label>
          {isEdit ? (
            <div className="flex h-11 items-center justify-between rounded-lg border border-border/70 bg-secondary/40 px-3.5 text-sm">
              <span className="font-medium">
                {formatQty(Number(ingredient?.stock_qty ?? 0), ingredient?.unit)}
              </span>
              <Lock className="size-3.5 text-muted-foreground" />
            </div>
          ) : (
            <Input
              id="stock_qty"
              name="stock_qty"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              defaultValue={0}
            />
          )}
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
      {isEdit && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Stok berubah lewat <b>Pembelian</b>, <b>Produksi</b>, atau{" "}
          <Link
            href="/opname"
            className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
          >
            <ClipboardCheck className="size-3.5" />
            Stock Opname
          </Link>{" "}
          — bukan diedit langsung, agar selisih selalu tercatat beserta alasannya.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="shelf_life_days">Masa segar (hari)</Label>
          <Input
            id="shelf_life_days"
            name="shelf_life_days"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            defaultValue={ingredient?.shelf_life_days ?? ""}
            placeholder="mis. 5"
          />
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
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Masa segar dihitung sejak pembelian terakhir; bahan yang lewat masa segar
        muncul sebagai peringatan. Kosongkan jika tidak perlu dipantau. Pemasok
        terisi otomatis dari pembelian terakhir.
      </p>

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
