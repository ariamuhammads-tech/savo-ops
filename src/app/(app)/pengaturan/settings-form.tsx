"use client";

import { useActionState, useEffect, useRef } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import type { BusinessSettings } from "@/lib/database.types";
import { updateBusinessSettings, type FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: FormState = { error: null, ok: false };

function Field({
  name,
  label,
  defaultValue,
  ...rest
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} {...rest} />
    </div>
  );
}

export function SettingsForm({ settings }: { settings: BusinessSettings | null }) {
  const [state, formAction] = useActionState(updateBusinessSettings, initial);
  const lastOk = useRef(false);

  useEffect(() => {
    if (state.ok && !lastOk.current) {
      lastOk.current = true;
      toast.success("Pengaturan disimpan.");
    }
    if (!state.ok) lastOk.current = false;
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {settings?.id && <input type="hidden" name="id" value={settings.id} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Bisnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field name="business_name" label="Nama bisnis *" defaultValue={settings?.business_name} required />
          <Field name="tagline" label="Tagline" defaultValue={settings?.tagline} placeholder="mis. Premium homemade frozen food" />
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" name="address" defaultValue={settings?.address ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field name="phone_wa" label="No. WhatsApp" defaultValue={settings?.phone_wa} inputMode="tel" />
            <Field name="instagram" label="Instagram" defaultValue={settings?.instagram} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field name="email" label="Email" defaultValue={settings?.email} type="email" />
            <Field name="npwp" label="NPWP" defaultValue={settings?.npwp} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field name="invoice_prefix" label="Prefix nomor" defaultValue={settings?.invoice_prefix ?? "INV"} placeholder="INV" />
            <Field name="tax_percent" label="Pajak (%)" defaultValue={settings?.tax_percent ?? 0} type="number" min="0" max="100" step="any" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice_notes">Catatan invoice</Label>
            <Textarea
              id="invoice_notes"
              name="invoice_notes"
              defaultValue={settings?.invoice_notes ?? ""}
              placeholder="mis. Pembayaran paling lambat 3 hari. Terima kasih!"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rekening Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field name="bank_name" label="Bank" defaultValue={settings?.bank_name} placeholder="mis. BCA" />
            <Field name="bank_account_no" label="No. rekening" defaultValue={settings?.bank_account_no} />
          </div>
          <Field name="bank_account_name" label="Atas nama" defaultValue={settings?.bank_account_name} />
        </CardContent>
      </Card>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton icon={Save} pendingText="Menyimpan…" className="w-full sm:w-auto">
        Simpan Pengaturan
      </SubmitButton>
    </form>
  );
}
