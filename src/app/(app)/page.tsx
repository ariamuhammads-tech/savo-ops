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
        {/* Architectural Standards Ribbon (Zero Box, Continuous Datum Ticker) */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
              PIPELINE METRIK // LIVE DATA
            </h2>
            <span className="text-[10.5px] font-mono text-muted-foreground/60">
              BANDUNG WHOLESALE SUPPLY
            </span>
          </div>

          <div className="border-y border-border divide-y divide-border sm:divide-y-0 sm:divide-x divide-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground block">
                01 // PROSPEK
              </span>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-foreground my-2">
                {totalCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                Terkurasi BDG
              </span>
            </div>

            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400 block">
                02 // ANTREAN
              </span>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-amber-700 dark:text-amber-400 my-2">
                {stagedCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                Perlu Tinjauan
              </span>
            </div>

            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground block">
                03 // TERKIRIM
              </span>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-foreground my-2">
                {sentCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                Menunggu Respon
              </span>
            </div>

            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300 block">
                04 // HENING ≥4H
              </span>
              <p className={`text-4xl lg:text-5xl font-extrabold tracking-tighter my-2 ${needsFollowUpCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                {needsFollowUpCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                {needsFollowUpCount > 0 ? "Perlu Nudge" : "Nihil"}
              </span>
            </div>

            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 block">
                05 // RESPON
              </span>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-emerald-700 dark:text-emerald-400 my-2">
                {repliedCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                Email & WA
              </span>
            </div>

            <div className="py-6 px-4 lg:px-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground block">
                06 // MITRA
              </span>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-foreground my-2">
                {partnerCount}
              </p>
              <span className="text-[10.5px] text-muted-foreground font-mono block">
                Repeat Order
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
