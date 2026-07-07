"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Check, Loader2 } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { calcMargin, suggestedPrice } from "@/lib/hpp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyPricesFromMargin } from "@/app/(app)/produk/actions";

/** Harga "cantik": bulatkan ke ratusan terdekat. */
const nice = (n: number) => (Number.isFinite(n) ? Math.round(n / 100) * 100 : 0);
const clampPct = (n: number) => Math.min(90, Math.max(0, Math.round(n)));
const num = (s: string) => {
  const n = Number(String(s).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Satu baris harga — DUA ARAH (review 2026-07-06):
 * geser slider mengisi harga, mengetik harga menggeser slider. Sumber
 * kebenaran = harga (string); margin & posisi slider diturunkan darinya.
 */
function PriceRow({
  label,
  currentPrice,
  hpp,
  price,
  onPrice,
}: {
  label: string;
  currentPrice: number;
  hpp: number;
  price: string;
  onPrice: (v: string) => void;
}) {
  const priceNum = num(price);
  const margin = hpp > 0 && priceNum > 0 ? calcMargin(priceNum, hpp) : 0;
  const sliderPct = clampPct(margin * 100);
  const changed = nice(priceNum) !== nice(currentPrice);
  const marginColor =
    priceNum <= 0
      ? "text-muted-foreground"
      : margin < 0
        ? "text-destructive"
        : "text-[color:var(--success)]";

  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          sekarang {currentPrice > 0 ? formatIDR(currentPrice) : "—"}
        </span>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={sliderPct}
          onChange={(e) => onPrice(String(nice(suggestedPrice(hpp, Number(e.target.value)))))}
          className="min-w-0 flex-1 accent-[color:var(--primary)]"
          aria-label={`Target margin ${label}`}
        />
        <span className={"w-16 text-right text-sm font-semibold tabular-nums " + marginColor}>
          {priceNum > 0 ? `${(margin * 100).toFixed(0)}%` : "—"}
          <span className="block text-[10px] font-normal text-muted-foreground">margin</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rp</span>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          step="any"
          value={price}
          onChange={(e) => onPrice(e.target.value)}
          className="h-10 text-right font-serif text-base font-bold"
          aria-label={`Harga jual ${label}`}
        />
        {changed && (
          <span className="whitespace-nowrap text-[11px] font-medium text-primary">
            {priceNum > currentPrice ? "▲" : "▼"}{" "}
            {formatIDR(Math.abs(priceNum - currentPrice))}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Saran harga dari target margin — geser slider ATAU ketik harga langsung
 * (dua arah), lalu "Terapkan" menyimpan ke produk. Dipakai di Resep & Produk.
 */
export function PriceSlider({
  productId,
  hpp,
  priceB2C,
  priceB2B,
}: {
  productId: string;
  hpp: number;
  priceB2C: number;
  priceB2B: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Sumber kebenaran = string harga (bisa diketik). Awal = harga sekarang,
  // atau saran default bila belum ada harga.
  const [pB2c, setPB2c] = useState(() =>
    String(priceB2C > 0 ? nice(priceB2C) : hpp > 0 ? nice(suggestedPrice(hpp, 40)) : 0),
  );
  const [pB2b, setPB2b] = useState(() =>
    String(priceB2B > 0 ? nice(priceB2B) : hpp > 0 ? nice(suggestedPrice(hpp, 30)) : 0),
  );

  const newB2c = nice(num(pB2c));
  const newB2b = nice(num(pB2b));
  const dirty = newB2c !== nice(priceB2C) || newB2b !== nice(priceB2B);

  function apply() {
    if (
      !window.confirm(
        `Terapkan harga baru?\n\nB2C: ${formatIDR(priceB2C)} → ${formatIDR(newB2c)}\nB2B: ${formatIDR(priceB2B)} → ${formatIDR(newB2b)}\n\nHarga ini dipakai untuk pesanan baru mulai sekarang.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await applyPricesFromMargin(productId, newB2c, newB2b);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Harga B2C & B2B diperbarui.");
      router.refresh();
    });
  }

  if (hpp <= 0) {
    return (
      <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
        HPP belum tersedia — lengkapi resep &amp; harga bahan dulu untuk memakai
        saran harga.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calculator className="size-4 text-primary" />
        Harga &amp; target margin
        <span className="text-xs font-normal text-muted-foreground">
          (HPP {formatIDR(hpp)}/unit)
        </span>
      </div>
      <PriceRow label="Harga B2C" currentPrice={priceB2C} hpp={hpp} price={pB2c} onPrice={setPB2c} />
      <PriceRow label="Harga B2B" currentPrice={priceB2B} hpp={hpp} price={pB2b} onPrice={setPB2b} />
      <Button
        onClick={apply}
        disabled={pending || !dirty}
        variant={dirty ? "default" : "secondary"}
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Menyimpan…
          </>
        ) : (
          <>
            <Check />
            Terapkan harga baru
          </>
        )}
      </Button>
      <p className="text-[11px] leading-tight text-muted-foreground">
        Geser slider atau ketik harga langsung — keduanya saling menyesuaikan.
        Menerapkan harga mengubah harga jual untuk pesanan berikutnya; pesanan
        lama tidak berubah.
      </p>
    </div>
  );
}
