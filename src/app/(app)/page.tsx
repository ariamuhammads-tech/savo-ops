"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StagedQueue } from "@/components/staged-queue";
import { AgentConsole } from "@/components/agent-console";
import { getStoredLeads, Lead, getLeadAgingNotice } from "@/lib/leads-data";
import { ReceiptText, Building2, Package, AlertTriangle, MessageSquare } from "lucide-react";

export default function DashboardHadesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setLeads(getStoredLeads());

    const handleUpdate = () => {
      setLeads(getStoredLeads());
    };

    window.addEventListener("savo_leads_updated", handleUpdate);
    return () => window.removeEventListener("savo_leads_updated", handleUpdate);
  }, []);

  const totalCount = leads.length;
  const stagedCount = leads.filter((l) => l.status === "staged").length;
  const sentCount = leads.filter((l) => l.status === "sent").length;
  const needsFollowUpCount = leads.filter(
    (l) => l.status === "sent" && getLeadAgingNotice(l)?.isActionRequired
  ).length;
  const repliedCount = leads.filter(
    (l) => l.status === "replied_email" || l.status === "replied_whatsapp"
  ).length;
  const partnerCount = leads.filter((l) => l.status === "partner").length;

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

      {/* Swiss Monoline Metric Bar (6 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-border rounded-xl bg-card divide-x divide-y sm:divide-y-0 divide-border overflow-hidden">
        <div className="p-4 space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Prospek
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {totalCount}
          </p>
          <span className="text-[10px] text-muted-foreground block">Terkurasi BDG</span>
        </div>

        <div className="p-4 space-y-1 bg-amber-500/5">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">
            Draf Antrean
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300">
            {stagedCount}
          </p>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block">
            Perlu dicek
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Terkirim
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {sentCount}
          </p>
          <span className="text-[10px] text-muted-foreground block">Menunggu respon</span>
        </div>

        <div className={`p-4 space-y-1 ${needsFollowUpCount > 0 ? "bg-amber-500/10 dark:bg-amber-950/40" : ""}`}>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-600" />
            Hening ≥4H
          </span>
          <p className={`font-display text-2xl font-bold tracking-tight ${needsFollowUpCount > 0 ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-foreground"}`}>
            {needsFollowUpCount}
          </p>
          <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80 block font-medium">
            {needsFollowUpCount > 0 ? "Butuh Nudge" : "Nihil"}
          </span>
        </div>

        <div className="p-4 space-y-1 bg-emerald-500/5">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <MessageSquare className="size-3 text-emerald-600" />
            Respon
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
            {repliedCount}
          </p>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block font-medium">
            Email & WA
          </span>
        </div>

        <div className="p-4 space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Mitra Aktif
          </span>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground">
            {partnerCount}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
            Repeat order
          </span>
        </div>
      </div>

      {/* Primary Section: Staged Email Queue */}
      <section className="space-y-4">
        <StagedQueue />
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
