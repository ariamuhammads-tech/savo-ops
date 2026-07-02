"use client";

import { useActionState, useState } from "react";
import { Plus, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { addExpense, type FormState } from "./actions";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initial: FormState = { error: null };
const CATEGORIES = ["Gaji", "Sewa", "Listrik & Air", "Gas", "Transport", "Kemasan", "Marketing", "Operasional", "Reimbursement", "Lainnya"];

export function ExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction] = useActionState(addExpense, initial);
  const [isReimburse, setIsReimburse] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const name = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(name, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(name);
      setPhotoUrl(data.publicUrl);
      toast.success("Foto struk terunggah.");
    } catch (err) {
      toast.error("Gagal unggah foto: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="is_reimbursement" value={isReimburse ? "true" : "false"} />
      <input type="hidden" name="photo_url" value={photoUrl} />

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
        <Input id="description" name="description" placeholder="mis. Beli galon & tisu" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount" className="text-xs">Jumlah (Rp) *</Label>
        <Input id="amount" name="amount" type="number" inputMode="numeric" min="0" step="any" required />
      </div>

      {/* Reimbursement */}
      <label className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/50 p-3">
        <input
          type="checkbox"
          checked={isReimburse}
          onChange={(e) => setIsReimburse(e.target.checked)}
          className="size-4 accent-[color:var(--primary)]"
        />
        <span className="text-sm font-medium">Reimbursement (uang pengganti karyawan)</span>
      </label>
      {isReimburse && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reimburse_to" className="text-xs">Untuk (nama)</Label>
            <Input id="reimburse_to" name="reimburse_to" placeholder="mis. Budi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reimburse_status" className="text-xs">Status</Label>
            <Select id="reimburse_status" name="reimburse_status" defaultValue="pending">
              <option value="pending">Belum dibayar</option>
              <option value="paid">Sudah dibayar</option>
            </Select>
          </div>
        </div>
      )}

      {/* Photo upload */}
      <div className="space-y-1.5">
        <Label className="text-xs">Foto struk (opsional)</Label>
        {photoUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-border/70 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Struk" className="size-14 rounded-md object-cover" />
            <span className="flex-1 truncate text-xs text-muted-foreground">Foto terlampir</span>
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="rounded-md p-2 text-muted-foreground hover:text-destructive"
              aria-label="Hapus foto"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-secondary/50">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {uploading ? "Mengunggah…" : "Ambil / pilih foto struk"}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        )}
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton icon={Plus} pendingText="Menyimpan…" className="w-full" disabled={uploading}>
        Catat Pengeluaran
      </SubmitButton>
    </form>
  );
}
