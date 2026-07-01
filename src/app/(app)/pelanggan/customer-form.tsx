"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

import type { Customer } from "@/lib/database.types";
import type { FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initial: FormState = { error: null };

export function CustomerForm({
  action,
  customer,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  customer?: Customer;
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      {customer && <input type="hidden" name="id" value={customer.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nama pelanggan *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={customer?.name ?? ""}
          placeholder="mis. Budi / Kafe Kopi Senja"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="type">Tipe</Label>
          <Select id="type" name="type" defaultValue={customer?.type ?? "b2c"}>
            <option value="b2c">B2C (perorangan)</option>
            <option value="b2b">B2B (bisnis)</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_tier">Tier harga</Label>
          <Select
            id="price_tier"
            name="price_tier"
            defaultValue={customer?.price_tier ?? "b2c"}
          >
            <option value="b2c">Harga B2C</option>
            <option value="b2b">Harga B2B</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_name">Nama bisnis (opsional)</Label>
        <Input
          id="business_name"
          name="business_name"
          defaultValue={customer?.business_name ?? ""}
          placeholder="mis. Kafe Kopi Senja"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="phone_wa">No. WhatsApp</Label>
          <Input
            id="phone_wa"
            name="phone_wa"
            type="tel"
            inputMode="tel"
            defaultValue={customer?.phone_wa ?? ""}
            placeholder="mis. 6281234567890"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            placeholder="opsional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={customer?.address ?? ""}
          placeholder="Alamat pengiriman / bisnis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_terms_days">Termin pembayaran (hari)</Label>
        <Input
          id="payment_terms_days"
          name="payment_terms_days"
          type="number"
          inputMode="numeric"
          min="0"
          defaultValue={customer?.payment_terms_days ?? 0}
        />
        <p className="text-xs text-muted-foreground">
          0 = bayar langsung. Umumnya B2B pakai termin (mis. 14 atau 30 hari).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
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
        Simpan
      </SubmitButton>
    </form>
  );
}
