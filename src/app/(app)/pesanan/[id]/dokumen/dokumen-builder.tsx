"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ProductOpt = { id: string; name: string; price_b2c: number; price_b2b: number };
export type BuilderItem = { name: string; qty: number; unit_price: number };

const JENIS = [
  { key: "penawaran", label: "Penawaran" },
  { key: "sales-order", label: "Sales Order" },
  { key: "invoice", label: "Invoice" },
] as const;

type Row = { key: number; productId: string; name: string; qty: string; price: string };
let counter = 1;

export function DokumenBuilder({
  orderId,
  products,
  initialItems,
  defaultJenis,
  priceTier,
  orderMeta,
}: {
  orderId: string;
  products: ProductOpt[];
  initialItems: BuilderItem[];
  defaultJenis: string;
  priceTier: "b2c" | "b2b";
  orderMeta: { discount: number; shipping: number; tax: number };
}) {
  const [jenis, setJenis] = useState(
    JENIS.some((j) => j.key === defaultJenis) ? defaultJenis : "penawaran",
  );
  const [rows, setRows] = useState<Row[]>(() =>
    initialItems.map((it) => ({
      key: counter++,
      productId: products.find((p) => p.name === it.name)?.id ?? "",
      name: it.name,
      qty: String(it.qty),
      price: String(it.unit_price),
    })),
  );
  const [promo, setPromo] = useState("");
  const [dp, setDp] = useState("");
  const [busy, setBusy] = useState(false);

  const tierPrice = (p: ProductOpt) => (priceTier === "b2b" ? p.price_b2b : p.price_b2c);

  const addRow = () =>
    setRows((r) => [...r, { key: counter++, productId: "", name: "", qty: "1", price: "0" }]);
  const removeRow = (key: number) => setRows((r) => r.filter((x) => x.key !== key));
  const setRow = (key: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  function pickProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    setRow(key, {
      productId,
      ...(p ? { name: p.name, price: String(tierPrice(p)) } : {}),
    });
  }

  const items: BuilderItem[] = rows
    .map((r) => ({
      name: r.name.trim(),
      qty: Number(r.qty.replace(",", ".")) || 0,
      unit_price: Number(r.price) || 0,
    }))
    .filter((it) => it.name && it.qty > 0);

  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  const total = Math.max(
    0,
    subtotal - orderMeta.discount + orderMeta.shipping + orderMeta.tax,
  );
  const dpValue = Math.max(0, Number(dp) || 0);
  const sisa = Math.max(0, total - dpValue);

  const jenisLabel = useMemo(
    () => JENIS.find((j) => j.key === jenis)?.label ?? "Dokumen",
    [jenis],
  );

  async function generate() {
    if (items.length === 0) {
      toast.error("Isi minimal satu baris item.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/dokumen/${orderId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jenis,
          items,
          promo_note: promo,
          down_payment: dpValue,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success(`${jenisLabel} dibuat.`);
    } catch {
      toast.error("Gagal membuat dokumen. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Jenis dokumen */}
      <div className="flex flex-wrap gap-1.5">
        {JENIS.map((j) => (
          <button
            key={j.key}
            type="button"
            onClick={() => setJenis(j.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              jenis === j.key
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {j.label}
          </button>
        ))}
      </div>

      {/* Item rows */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <p className="font-medium">Item dokumen</p>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-sm font-medium hover:bg-secondary/70"
            >
              <Plus className="size-4" />
              Tambah
            </button>
          </div>

          {rows.map((r) => (
            <div key={r.key} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-start gap-2">
                <Select
                  value={r.productId}
                  onChange={(e) => pickProduct(r.key, e.target.value)}
                  className="flex-1"
                >
                  <option value="">— Produk (atau isi manual) —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => removeRow(r.key)}
                  className="rounded-md p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Hapus baris"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mb-2 space-y-1">
                <Label className="text-xs">Nama di dokumen</Label>
                <Input
                  value={r.name}
                  onChange={(e) => setRow(r.key, { name: e.target.value, productId: "" })}
                  placeholder="mis. Bitterballen (isi 15)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={r.qty}
                    onChange={(e) => setRow(r.key, { qty: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Harga (Rp)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="any"
                    value={r.price}
                    onChange={(e) => setRow(r.key, { price: e.target.value })}
                  />
                </div>
              </div>
              <p className="mt-2 text-right text-sm text-muted-foreground">
                Subtotal:{" "}
                <span className="font-medium text-foreground">
                  {formatIDR((Number(r.qty) || 0) * (Number(r.price) || 0))}
                </span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Promo & DP */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="promo">Keterangan promo (opsional)</Label>
            <Textarea
              id="promo"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="mis. Promo opening: gratis ongkir Bandung, harga khusus 3 bulan pertama…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dp">Down Payment / DP (Rp, opsional)</Label>
            <Input
              id="dp"
              type="number"
              inputMode="numeric"
              min="0"
              step="any"
              value={dp}
              onChange={(e) => setDp(e.target.value)}
              placeholder="mis. 500000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan */}
      <Card>
        <CardContent className="space-y-1.5 pt-6 text-sm">
          <RowLine label="Subtotal" value={formatIDR(subtotal)} />
          {orderMeta.discount > 0 && (
            <RowLine label="Diskon (dari pesanan)" value={`−${formatIDR(orderMeta.discount)}`} />
          )}
          {orderMeta.shipping > 0 && (
            <RowLine label="Ongkir (dari pesanan)" value={formatIDR(orderMeta.shipping)} />
          )}
          {orderMeta.tax > 0 && (
            <RowLine label="Pajak (dari pesanan)" value={formatIDR(orderMeta.tax)} />
          )}
          <div className="flex justify-between border-t border-border pt-1.5 font-medium">
            <span>Total</span>
            <span>{formatIDR(total)}</span>
          </div>
          {dpValue > 0 && (
            <>
              <RowLine label="Down Payment" value={`−${formatIDR(dpValue)}`} />
              <div className="flex justify-between font-medium text-primary">
                <span>Sisa tagihan</span>
                <span>{formatIDR(sisa)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={generate} disabled={busy} className="w-full">
        {busy ? (
          <>
            <Loader2 className="animate-spin" />
            Membuat…
          </>
        ) : (
          <>
            <FileText />
            Buat {jenisLabel} (PDF)
          </>
        )}
      </Button>
    </div>
  );
}

function RowLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
