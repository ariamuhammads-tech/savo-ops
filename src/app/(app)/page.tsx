"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StagedQueue } from "@/components/staged-queue";
import { AgentConsole } from "@/components/agent-console";
import { getStoredLeads, Lead, getLeadAgingNotice } from "@/lib/leads-data";
import { ReceiptText, Building2, Package, AlertTriangle, MessageSquare, ArrowUpRight } from "lucide-react";
import { SavoLogo } from "@/components/savo-logo";

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
    <div className="w-full">
      {/* Aura Hero Studio Centerpiece */}
      <section className="hero-expanse">
        <div className="hero-meta-left">
          SAVO EATS // B2B SUPPLY<br />
          BANDUNG, WEST JAVA<br />
          SPECIALTY SNACK WHOLESALE
        </div>

        <div className="hero-meta-right">
          ACQUISITION ENGINE: HADES<br />
          STATUS: ONLINE & CURATING<br />
          OFFICIAL: THESAVORIUM@GMAIL.COM
        </div>

        {/* Floating SAVO Brandmark */}
        <div className="my-2 flex justify-center items-center">
          <SavoLogo className="h-16 md:h-20 w-auto text-primary transition-transform duration-300 hover:scale-105" />
        </div>

        <h1 className="hero-brand-name">SAVO EATS</h1>
        <p className="hero-tagline">
          Pusat Komando Akuisisi B2B Kafe Bandung • Bitterballen & Baso Goreng
        </p>

        {/* Dynamic Hades Status Pill */}
        <div className="pixel-companion-bar">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-foreground">HADES ACTIVE:</span>
          <span className="font-mono text-xs text-muted-foreground">
            Kurasi kafe Bandung & antrean draf email penawaran B2B siap ditinjau
          </span>
        </div>
      </section>

      {/* Aura Principle Divider Strip */}
      <div className="principle-strip">
        <div className="font-semibold text-foreground">
          PRINSIP 01: READY-TO-FRY WHOLESALE SPEC • MARGIN KAFE 50% – 65%
        </div>
        <div>
          FORMULA PENAWARAN: LOW-FRICTION TAMBAHAN MENU • TARGET MAKS. 5 EMAIL / HARI
        </div>
      </div>

      {/* Aura Expansive Content Arena */}
      <div className="content-container space-y-12">
        {/* Compact Standards Ribbon (6 Metrik Pipeline) */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.14em] text-foreground">
              Pipeline Metrik Akuisisi Bandung
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              Live Pipeline Data
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="border border-border rounded-lg p-4 bg-background hover:border-foreground transition-all">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Prospek
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-foreground my-1">
                {totalCount}
              </p>
              <span className="text-[11px] text-muted-foreground block font-mono">Terkurasi BDG</span>
            </div>

            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/5 hover:border-amber-500 transition-all">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Draf Antrean
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-amber-800 dark:text-amber-300 my-1">
                {stagedCount}
              </p>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block font-mono">Perlu dicek</span>
            </div>

            <div className="border border-border rounded-lg p-4 bg-background hover:border-foreground transition-all">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Terkirim
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-foreground my-1">
                {sentCount}
              </p>
              <span className="text-[11px] text-muted-foreground block font-mono">Menunggu respon</span>
            </div>

            <div className={`border rounded-lg p-4 transition-all ${needsFollowUpCount > 0 ? "border-amber-500 bg-amber-500/10" : "border-border bg-background hover:border-foreground"}`}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <AlertTriangle className="size-3 text-amber-600" />
                Hening ≥4H
              </span>
              <p className={`text-3xl font-extrabold tracking-tight my-1 ${needsFollowUpCount > 0 ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-foreground"}`}>
                {needsFollowUpCount}
              </p>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 block font-mono font-medium">
                {needsFollowUpCount > 0 ? "Butuh Nudge" : "Nihil"}
              </span>
            </div>

            <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5 hover:border-emerald-500 transition-all">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <MessageSquare className="size-3 text-emerald-600" />
                Respon
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300 my-1">
                {repliedCount}
              </p>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block font-mono font-medium">
                Email & WA
              </span>
            </div>

            <div className="border border-border rounded-lg p-4 bg-background hover:border-foreground transition-all">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                Mitra Aktif
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-foreground my-1">
                {partnerCount}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-mono font-medium">
                Repeat order
              </span>
            </div>
          </div>
        </section>

        {/* Aura Section Block 01: Staged Queue */}
        <section className="aura-section-block">
          <div className="section-index-eyebrow">
            <span>01</span>
            <span>//</span>
            <span>MEJA PERSETUJUAN DRAF EMAIL HADES</span>
          </div>
          <h2 className="section-headline">
            Antrean Draf Penawaran B2B Siap Kirim
          </h2>
          <p className="section-desc-lead">
            Draf email penawaran B2B disusun otomatis oleh Hades menggunakan formula low-friction sesama pelaku usaha Bandung. Tinjau dan setujui sebelum dikirim melalui thesavorium@gmail.com.
          </p>

          <StagedQueue />
        </section>

        {/* Aura Section Block 02: Interactive Agent Console */}
        <section className="aura-section-block">
          <div className="section-index-eyebrow">
            <span>02</span>
            <span>//</span>
            <span>INTERACTIVE AGENT TERMINAL</span>
          </div>
          <h2 className="section-headline">
            Konsol Perintah Agen Hades
          </h2>
          <p className="section-desc-lead">
            Kueri data kafe Bandung, simulasikan unit economics & margin laba kafe, dan minta kurasi prospek area secara interaktif.
          </p>

          <AgentConsole />
        </section>

        {/* Bottom Principle & Navigation Strip */}
        <div className="pt-8 border-t border-border flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/leads" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
              <Building2 className="size-3.5" />
              <span>Database Kafe Bandung</span>
              <ArrowUpRight className="size-3 opacity-60" />
            </Link>
            <Link href="/katalog" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
              <Package className="size-3.5" />
              <span>Katalog & Margin B2B</span>
              <ArrowUpRight className="size-3 opacity-60" />
            </Link>
            <Link href="/invoice" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
              <ReceiptText className="size-3.5 text-primary" />
              <span>Generator Invoice</span>
              <ArrowUpRight className="size-3 opacity-60" />
            </Link>
          </div>

          <span className="font-mono text-[11px] text-muted-foreground/80">
            SAVO OPS // ACQUISITION BUREAU BANDUNG V2.0
          </span>
        </div>
      </div>
    </div>
  );
}
