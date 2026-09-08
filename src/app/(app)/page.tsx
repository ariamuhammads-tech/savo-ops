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
    <div className="content-container space-y-12">
      {/* Studio Header: Clean, Dignified & Quiet */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-6 gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Savo Eats · Operasional B2B Bandung</p>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
            Pusat Komando Akuisisi
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
            Kurasi kafe specialty Bandung, kelola draf penawaran Bitterballen &amp; Baso Goreng, dan pantau respon kemitraan.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Hades Aktif
          </span>
          <span>·</span>
          <span>thesavorium@gmail.com</span>
        </div>
      </div>

      {/* Metrics Strip (Pure Typographic Open Space — Zero Boxes) */}
      <section>
        <div className="border-y border-border/40 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Prospek Kafe
            </span>
            <p className="text-4xl lg:text-5xl font-light tracking-tight text-foreground my-2">
              {totalCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              Terkurasi Bandung
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Antrean Draf
            </span>
            <p className="text-4xl lg:text-5xl font-light tracking-tight text-foreground my-2">
              {stagedCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              Menunggu persetujuan
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Terkirim
            </span>
            <p className="text-4xl lg:text-5xl font-light tracking-tight text-foreground my-2">
              {sentCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              Menunggu respon
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Perlu Follow-up
            </span>
            <p className={`text-4xl lg:text-5xl font-light tracking-tight my-2 ${needsFollowUpCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {needsFollowUpCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              {needsFollowUpCount > 0 ? "Hening ≥4 hari" : "Semua terjaga"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Respon Masuk
            </span>
            <p className="text-4xl lg:text-5xl font-light tracking-tight text-foreground my-2">
              {repliedCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              Email &amp; WA
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest block font-medium">
              Mitra Aktif
            </span>
            <p className="text-4xl lg:text-5xl font-light tracking-tight text-foreground my-2">
              {partnerCount}
            </p>
            <span className="text-xs text-muted-foreground block">
              Kerjasama suplai
            </span>
          </div>
        </div>
      </section>

      {/* Section 01: Staged Queue */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Antrean Draf Penawaran Siap Kirim
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Draf email penawaran disusun otomatis oleh Hades menggunakan formula low-friction sesama pelaku usaha Bandung. Tinjau dan setujui sebelum dikirim melalui thesavorium@gmail.com.
          </p>
        </div>

        <StagedQueue />
      </section>

      {/* Section 02: Interactive Agent Console */}
      <section className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Konsol Asisten Hades
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Kueri data kafe Bandung, simulasikan margin laba kafe, dan minta kurasi prospek area secara langsung.
          </p>
        </div>

        <AgentConsole />
      </section>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-border flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/leads" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
            <Building2 className="size-3.5" />
            <span>Database Kafe Bandung</span>
            <ArrowUpRight className="size-3 opacity-60" />
          </Link>
          <Link href="/katalog" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
            <Package className="size-3.5" />
            <span>Katalog &amp; Margin B2B</span>
            <ArrowUpRight className="size-3 opacity-60" />
          </Link>
          <Link href="/invoice" className="hover:text-foreground font-medium flex items-center gap-1.5 transition-colors">
            <ReceiptText className="size-3.5 text-foreground" />
            <span>Generator Invoice</span>
            <ArrowUpRight className="size-3 opacity-60" />
          </Link>
        </div>

        <span className="text-xs text-muted-foreground">
          Savo Eats · Sistem Akuisisi B2B
        </span>
      </div>
    </div>
  );
}
