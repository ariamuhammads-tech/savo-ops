import Link from "next/link";
import { SAVO_PRICING } from "@/lib/leads-data";

export default function KatalogB2BPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="border-b border-border pb-6 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
          PRICING & UNIT ECONOMICS // B2B WHOLESALE
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Katalog Produk & Margin B2B SAVO
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Struktur harga grosir resmi untuk pasokan ke coffee shop, bistro, dan bar di Bandung. Dirancang memberikan margin laba di atas 50% bagi kafe mitra.
        </p>
      </div>

      {/* Product Spec Table Grid (Swiss Editorial Layout) */}
      <div className="space-y-6">
        {/* Product 1: Bitterballen Original */}
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary font-bold">
                SIGNATURE FINGER FOOD
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
                {SAVO_PRICING.bitterballen_ori.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-display text-xl font-bold text-primary">
                Rp {SAVO_PRICING.bitterballen_ori.b2b_price.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-muted-foreground block font-mono">/ pack (10 pcs)</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Kroket daging sapi khas Belanda dengan isian 100% Australian Beef bertekstur ragout creamy gurih dan aroma rempah pala asli. Sangat disukai sebagai pendamping kopi di kafe artisan.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Porsi Kafe (5 pcs)</span>
              <span className="font-mono font-bold text-foreground">
                HPP Rp {SAVO_PRICING.bitterballen_ori.hpp_per_portion.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Saran Harga Jual</span>
              <span className="font-mono font-bold text-foreground">
                Rp {SAVO_PRICING.bitterballen_ori.recommended_sell_price.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block font-medium">Margin Laba Kafe</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {SAVO_PRICING.bitterballen_ori.margin_percent}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Waktu Deep-Fry</span>
              <span className="font-mono font-medium text-foreground">3.5 Menit (170°C)</span>
            </div>
          </div>
        </div>

        {/* Product 2: Bitterballen Cheese */}
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary font-bold">
                PREMIUM VARIANT
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
                {SAVO_PRICING.bitterballen_cheese.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-display text-xl font-bold text-primary">
                Rp {SAVO_PRICING.bitterballen_cheese.b2b_price.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-muted-foreground block font-mono">/ pack (10 pcs)</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Varian favorit generasi muda: perpaduan daging sapi Australia dengan lelehan keju mozarella/cheddar gurih di setiap gigitan. Sempurna untuk kafe brunch dan beer house.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Porsi Kafe (5 pcs)</span>
              <span className="font-mono font-bold text-foreground">
                HPP Rp {SAVO_PRICING.bitterballen_cheese.hpp_per_portion.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Saran Harga Jual</span>
              <span className="font-mono font-bold text-foreground">
                Rp {SAVO_PRICING.bitterballen_cheese.recommended_sell_price.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block font-medium">Margin Laba Kafe</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {SAVO_PRICING.bitterballen_cheese.margin_percent}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Waktu Deep-Fry</span>
              <span className="font-mono font-medium text-foreground">3.5 Menit (170°C)</span>
            </div>
          </div>
        </div>

        {/* Product 3: Baso Goreng Ready-to-Fry */}
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary font-bold">
                HIGH-VOLUME CROWD PLEASER
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
                {SAVO_PRICING.baso_goreng.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="font-display text-xl font-bold text-primary">
                {SAVO_PRICING.baso_goreng.b2b_price_range}
              </span>
              <span className="text-xs text-muted-foreground block font-mono">/ 10 pcs</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Baso goreng homemade siap goreng dengan tekstur garing mekar di luar, kopong kenyal di dalam, serta rasa gurih gurih umami asli. Disukai semua kalangan, cocok untuk bar snack dan nongkrong malam.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Porsi Kafe (3 pcs potong)</span>
              <span className="font-mono font-bold text-foreground">
                HPP Rp {SAVO_PRICING.baso_goreng.hpp_per_portion.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Saran Harga Jual</span>
              <span className="font-mono font-bold text-foreground">
                Rp {SAVO_PRICING.baso_goreng.recommended_sell_price.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block font-medium">Margin Laba Kafe</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {SAVO_PRICING.baso_goreng.margin_percent}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
              <span className="text-muted-foreground text-[11px] block">Karakter Goreng</span>
              <span className="font-mono font-medium text-foreground">Kopong & Awet Renyah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tasting Box Specification */}
      <div className="border border-border rounded-xl bg-secondary/20 p-6 space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-bold">
          STRATEGI AKUISISI // ZERO FRICTION
        </span>
        <h3 className="font-display text-lg font-bold text-foreground">
          {SAVO_PRICING.sample_pack.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Porsi kurasi sampel tester: <strong>{SAVO_PRICING.sample_pack.contents}</strong>.
          Porsi ini sengaja dirancang ringkas agar hemat biaya operasional bagi SAVO, namun memberikan bukti kualitas rasa yang cukup bagi barista lead dan kitchen supervisor sebelum menyepakati pesanan rutin.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            Tinjau Antrean Email Penawaran Tester di HQ Hades &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
