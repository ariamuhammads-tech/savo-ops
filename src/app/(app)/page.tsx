import Link from "next/link";
import { StagedQueue } from "@/components/staged-queue";
import { AgentConsole } from "@/components/agent-console";
import { INITIAL_LEADS } from "@/lib/leads-data";
import { ReceiptText, Building2, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardHadesPage() {
  const stagedCount = INITIAL_LEADS.filter((l) => l.status === "staged").length;
  const sentCount = INITIAL_LEADS.filter((l) => l.status === "sent").length;
  const partnerCount = INITIAL_LEADS.filter((l) => l.status === "partner").length;
  const totalCount = INITIAL_LEADS.length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-600" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
            SAVO OPS // ONLINE B2B BUREAU
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Pusat Komando Agen Hades
          </h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Akun Resmi:</span>
            <code className="px-2 py-0.5 rounded bg-secondary text-foreground font-mono font-medium">
              thesavorium@gmail.com
            </code>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Otomasi kurasi prospek kafe Bandung dan pengiriman email penawaran B2B untuk pasokan Bitterballen dan Baso Goreng. Email hanya dikirimkan setelah persetujuan Anda.
        </p>
      </div>

      {/* Swiss Monoline Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-xl bg-card divide-x divide-y md:divide-y-0 divide-border overflow-hidden">
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Prospek Terkurasi
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {totalCount}
          </p>
          <span className="text-[11px] text-muted-foreground block">Wilayah Bandung</span>
        </div>

        <div className="p-4 space-y-1 bg-amber-500/5">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
            Draf Staged (Antrean)
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
            {stagedCount}
          </p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block">
            Perlu persetujuan
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Email Terkirim
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {sentCount}
          </p>
          <span className="text-[11px] text-muted-foreground block">thesavorium@gmail.com</span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Mitra Aktif (Deal)
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {partnerCount}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
            Repeat order rutin
          </span>
        </div>
      </div>

      {/* Primary Section: Staged Email Queue */}
      <section className="space-y-4">
        <StagedQueue initialLeads={INITIAL_LEADS} />
      </section>

      {/* Secondary Section: Interactive Console for Hades */}
      <section className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Perintah & Konsol Hades
          </h2>
          <span className="text-xs text-muted-foreground">
            Kueri data, hitung margin kafe, dan kurasi area
          </span>
        </div>
        <AgentConsole />
      </section>

      {/* Quick Navigation Footer Bar */}
      <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="hover:text-foreground font-medium flex items-center gap-1">
            <Building2 className="size-3.5" />
            Database Kafe Bandung
          </Link>
          <span>•</span>
          <Link href="/katalog" className="hover:text-foreground font-medium flex items-center gap-1">
            <Package className="size-3.5" />
            Katalog & Margin B2B
          </Link>
          <span>•</span>
          <Link href="/invoice" className="hover:text-foreground font-medium flex items-center gap-1">
            <ReceiptText className="size-3.5 text-primary" />
            Generator Invoice
          </Link>
        </div>

        <span className="font-mono text-[11px]">SAVO B2B ACQUISITION // BANDUNG V1.0</span>
      </div>
    </div>
  );
}
