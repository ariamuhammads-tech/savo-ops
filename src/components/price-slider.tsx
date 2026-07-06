"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Check, Loader2 } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { calcMargin, suggestedPrice } from "@/lib/hpp";
import { Button } from "@/components/ui/button";
import { applyPricesFromMargin } from "@/app/(app)/produk/actions";

/** Harga "cantik": bulatkan ke ratusan terdekat. */
const nice = (n: number) => (Number.isFinite(n) ? Math.round(n / 100) * 100 : 0);

const clampPct = (n: number) => Math.min(90, Math.max(0, Math.round(n)));

function SliderRow({
  label,
  currentPrice,
  hpp,
  target,
  onTarget,
}: {
  label: string;
  currentPrice: number;
  hpp: number;
  target: number;
  onTarget: (n: number) => void;
}) {
  const newPrice = nice(suggestedPrice(hpp, target));
  const changed = newPrice !== nice(currentPrice);
  return (
    <div className="rounded-lg bg-secondary/60 p-3">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          sekarang {currentPrice > 0 ? formatIDR(currentPrice) : "—"}
          {currentPrice > 0 && hpp > 0 && (
            <> · margin {(calcMargin(currentPrice, hpp) * 100).toFixed(0)}%</>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={target}
          onChange={(e) => onTarget(Number(e.target.value))}
          className="min-w-0 flex-1 accent-[color:var(--primary)]"
          aria-label={`Target margin ${label}`}
        />
        <span className="w-10 text-right text-sm font-semibold tabular-nums">
          {target}%
        </span>
        <span
          className={
            "w-24 text-right font-serif text-base font-bold " +
            (changed ? "text-primary" : "text-muted-foreground")
          }
        >
          {formatIDR(newPrice)}
        </span>
      </div>
    </div>
  );
}

/**
 * Saran harga dari target margin — geser slider, harga B2C & B2B baru
 * langsung terlihat, lalu "Terapkan" menyimpannya ke produk
 * (review 2026-07-06 #2: dipakai di halaman Resep DAN Produk).
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
  const [tB2c, setTB2c] = useState(() =>
    priceB2C > 0 && hpp > 0 ? clampPct(calcMargin(priceB2C, hpp) * 100) : 40,
  );
  const [tB2b, setTB2b] = useState(() =>
    priceB2B > 0 && hpp > 0 ? clampPct(calcMargin(priceB2B, hpp) * 100) : 30,
  );

  const newB2c = nice(suggestedPrice(hpp, tB2c));
  const newB2b = nice(suggestedPrice(hpp, tB2b));
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
        Saran harga dari target margin
        <span className="text-xs font-normal text-muted-foreground">
          (HPP {formatIDR(hpp)}/unit)
        </span>
      </div>
      <SliderRow
        label="Harga B2C"
        currentPrice={priceB2C}
        hpp={hpp}
        target={tB2c}
        onTarget={setTB2c}
      />
      <SliderRow
        label="Harga B2B"
        currentPrice={priceB2B}
        hpp={hpp}
        target={tB2b}
        onTarget={setTB2b}
      />
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
        Harga dibulatkan ke ratusan. Menerapkan harga mengubah harga jual produk
        untuk pesanan berikutnya — pesanan lama tidak berubah.
      </p>
    </div>
  );
}
