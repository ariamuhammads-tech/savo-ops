"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { createOrder, type FormState } from "./actions";
import { CHANNEL_LABEL } from "./labels";
import { SubmitButton } from "@/components/form-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type CustomerOpt = { id: string; name: string; price_tier: "b2c" | "b2b"; type: string };
type ProductOpt = {
  id: string;
  name: string;
  price_b2c: number;
  price_b2b: number;
  unit: string;
  stock_qty: number;
};
type Line = { key: number; productId: string; qty: string; unitPrice: string };

const initial: FormState = { error: null };
let counter = 1;

export function OrderBuilder({
  customers,
  products,
  defaultDate,
}: {
  customers: CustomerOpt[];
  products: ProductOpt[];
  defaultDate: string;
}) {
  const [state, formAction] = useActionState(createOrder, initial);

  const [customerId, setCustomerId] = useState("");
  const [channel, setChannel] = useState("wa");
  const [orderDate, setOrderDate] = useState(defaultDate);
  const [discount, setDiscount] = useState("0");
  const [shipping, setShipping] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const tier: "b2c" | "b2b" =
    customers.find((c) => c.id === customerId)?.price_tier ?? "b2c";

  const priceOf = (p: ProductOpt) =>
    tier === "b2b" ? Number(p.price_b2b) : Number(p.price_b2c);

  function addLine() {
    setLines((l) => [...l, { key: counter++, productId: "", qty: "1", unitPrice: "0" }]);
  }
  function removeLine(key: number) {
    setLines((l) => l.filter((x) => x.key !== key));
  }
  function setProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    setLines((l) =>
      l.map((x) =>
        x.key === key
          ? { ...x, productId, unitPrice: p ? String(priceOf(p)) : x.unitPrice }
          : x,
      ),
    );
  }
  function setLineField(key: number, field: "qty" | "unitPrice", value: string) {
    setLines((l) => l.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }
  function onCustomerChange(id: string) {
    setCustomerId(id);
    const newTier = customers.find((c) => c.id === id)?.price_tier ?? "b2c";
    setLines((l) =>
      l.map((x) => {
        const p = products.find((pp) => pp.id === x.productId);
        return p ? { ...x, unitPrice: String(newTier === "b2b" ? p.price_b2b : p.price_b2c) } : x;
      }),
    );
  }

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unitPrice || 0), 0),
    [lines],
  );
  const total = subtotal - Number(discount || 0) + Number(shipping || 0) + Number(tax || 0);

  const itemsPayload = JSON.stringify(
    lines
      .filter((l) => l.productId && Number(l.qty) > 0)
      .map((l) => {
        const p = products.find((x) => x.id === l.productId);
        return {
          product_id: l.productId,
          name: p?.name ?? "",
          qty: Number(l.qty),
          unit_price: Number(l.unitPrice),
        };
      }),
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* hidden payload */}
      <input type="hidden" name="items" value={itemsPayload} />
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="order_date" value={orderDate} />
      <input type="hidden" name="discount" value={discount || "0"} />
      <input type="hidden" name="shipping" value={shipping || "0"} />
      <input type="hidden" name="tax" value={tax || "0"} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="contact_name" value={contactName} />
      <input type="hidden" name="contact_phone" value={contactPhone} />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-2">
            <Label htmlFor="cust">Pelanggan</Label>
            <Select
              id="cust"
              value={customerId}
              onChange={(e) => onCustomerChange(e.target.value)}
            >
              <option value="">Umum / tanpa pelanggan (harga B2C)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.price_tier.toUpperCase()})
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Harga otomatis memakai tier{" "}
              <span className="font-medium">{tier.toUpperCase()}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nama pemesan</Label>
              <Input
                id="contact_name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="mis. Budi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">No. WhatsApp</Label>
              <Input
                id="contact_phone"
                type="tel"
                inputMode="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="mis. 62812xxxx"
              />
            </div>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">
            Untuk pesanan tanpa pelanggan tersimpan — nama & nomor ini akan
            tampil di invoice. (Jika memilih pelanggan, data pelanggan yang
            dipakai.)
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select id="channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {Object.entries(CHANNEL_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product lines */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <p className="font-medium">Produk</p>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-sm font-medium hover:bg-secondary/70"
            >
              <Plus className="size-4" />
              Tambah
            </button>
          </div>

          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada produk. Ketuk “Tambah”.
            </p>
          )}

          {lines.map((l) => {
            const p = products.find((x) => x.id === l.productId);
            const lineTotal = Number(l.qty || 0) * Number(l.unitPrice || 0);
            return (
              <div key={l.key} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-start gap-2">
                  <Select
                    value={l.productId}
                    onChange={(e) => setProduct(l.key, e.target.value)}
                    className="flex-1"
                  >
                    <option value="" disabled>
                      — Pilih produk —
                    </option>
                    {products.map((pp) => (
                      <option key={pp.id} value={pp.id}>
                        {pp.name} (stok {Number(pp.stock_qty)})
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeLine(l.key)}
                    className="rounded-md p-2 text-muted-foreground hover:text-destructive"
                    aria-label="Hapus baris"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Jumlah {p ? `(${p.unit})` : ""}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={l.qty}
                      onChange={(e) => setLineField(l.key, "qty", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Harga satuan</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="any"
                      value={l.unitPrice}
                      onChange={(e) => setLineField(l.key, "unitPrice", e.target.value)}
                    />
                  </div>
                </div>
                <p className="mt-2 text-right text-sm text-muted-foreground">
                  Subtotal:{" "}
                  <span className="font-medium text-foreground">{formatIDR(lineTotal)}</span>
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatIDR(subtotal)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Diskon</Label>
              <Input type="number" min="0" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ongkir</Label>
              <Input type="number" min="0" step="any" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pajak</Label>
              <Input type="number" min="0" step="any" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="font-serif text-xl font-bold text-primary">
              {formatIDR(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton icon={ShoppingCart} pendingText="Menyimpan…" className="w-full">
        Simpan Pesanan
      </SubmitButton>
    </form>
  );
}
