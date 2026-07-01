"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";

import { addExpense, type FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: FormState = { error: null };
const CATEGORIES = ["Gaji", "Sewa", "Listrik & Air", "Gas", "Transport", "Kemasan", "Marketing", "Operasional", "Lainnya"];

export function ExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction] = useActionState(addExpense, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expense_date" className="text-xs">Tanggal</Label>
          <Input id="expense_date" name="expense_date" type="date" defaultValue={defaultDate} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs">Kategori</Label>
          <Input id="category" name="category" list="kat-list" placeholder="mis. Gaji" />
          <datalist id="kat-list">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs">Keterangan *</Label>
        <Input id="description" name="description" placeholder="mis. Gaji karyawan Juli" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount" className="text-xs">Jumlah (Rp) *</Label>
        <Input id="amount" name="amount" type="number" inputMode="numeric" min="0" step="any" required />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton icon={Plus} pendingText="Menyimpan…" className="w-full">
        Catat Pengeluaran
      </SubmitButton>
    </form>
  );
}
