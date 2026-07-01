"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { calcMargin, suggestedPrice } from "@/lib/hpp";

function MarginRow({
  label,
  price,
  hppPerUnit,
}: {
  label: string;
  price: number;
  hppPerUnit: number;
}) {
  const margin = calcMargin(price, hppPerUnit);
  const profit = price - hppPerUnit;
  const hasPrice = price > 0;
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{hasPrice ? formatIDR(price) : "—"}</p>
      </div>
      <div className="text-right">
        <p
          className={
            "font-semibold " +
            (!hasPrice
              ? "text-muted-foreground"
              : margin < 0
                ? "text-destructive"
                : "text-[color:var(--success)]")
          }
        >
          {hasPrice ? `${(margin * 100).toFixed(0)}%` : "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasPrice ? `${formatIDR(profit)}/unit` : "harga belum diisi"}
        </p>
      </div>
    </div>
  );
}

export function HppCalculator({
  hppPerUnit,
  priceB2C,
  priceB2B,
}: {
  hppPerUnit: number;
  priceB2C: number;
  priceB2B: number;
}) {
  const [target, setTarget] = useState(40);
  const suggestion = suggestedPrice(hppPerUnit, target);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MarginRow label="Harga B2C" price={priceB2C} hppPerUnit={hppPerUnit} />
        <MarginRow label="Harga B2B" price={priceB2B} hppPerUnit={hppPerUnit} />
      </div>

      <div className="rounded-lg border border-dashed border-border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Calculator className="size-4 text-primary" />
          Saran harga dari target margin
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-28 accent-[color:var(--primary)]"
            />
            <span className="w-12 text-sm font-semibold tabular-nums">
              {target}%
            </span>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Saran harga jual</p>
            <p className="font-serif text-lg font-bold text-primary">
              {Number.isFinite(suggestion) ? formatIDR(suggestion) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
