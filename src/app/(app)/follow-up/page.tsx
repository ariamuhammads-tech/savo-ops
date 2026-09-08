"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lead,
  LeadStatus,
  STATUS_CONFIG,
  PRODUCT_LABELS,
  getStoredLeads,
  updateStoredLeadStatus,
  getLeadAgingNotice,
} from "@/lib/leads-data";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { toast } from "sonner";
import {
  ArrowRight,
  Sparkles,
  FileText,
} from "lucide-react";

export default function FollowUpPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | "needs_action" | "replied" | "waiting">("all");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState<string | null>(null);

  useEffect(() => {
    setLeads(getStoredLeads());

    const handleUpdate = () => setLeads(getStoredLeads());
    window.addEventListener("savo_leads_updated", handleUpdate);
    return () => window.removeEventListener("savo_leads_updated", handleUpdate);
  }, []);

  const sentLeads = leads.filter(
    (l) => l.status === "sent" || l.status.startsWith("replied") || l.status === "sample_arranged" || l.status === "partner"
  );

  const needsActionLeads = sentLeads.filter((l) => {
    const aging = getLeadAgingNotice(l);
    return aging?.isActionRequired || l.status.startsWith("replied") || l.status === "sample_arranged";
  });

  const repliedLeads = sentLeads.filter(
    (l) => l.status.startsWith("replied") || l.status === "sample_arranged" || l.status === "partner"
  );

  const waitingLeads = sentLeads.filter((l) => {
    const aging = getLeadAgingNotice(l);
    return l.status === "sent" && !aging?.isActionRequired;
  });

  const displayedLeads =
    filter === "needs_action"
      ? needsActionLeads
      : filter === "replied"
      ? repliedLeads
      : filter === "waiting"
      ? waitingLeads
      : sentLeads;

  const handleSetStatus = (leadId: string, newStatus: LeadStatus) => {
    const updated = updateStoredLeadStatus(leadId, newStatus);
    setLeads(updated);
    toast.success(`Status kafe diperbarui ke: ${STATUS_CONFIG[newStatus].label}`);
  };

  const handleGenerateFollowUp = async (lead: Lead) => {
    setIsGeneratingFollowUp(lead.id);
    try {
      const res = await fetch("/api/hades/refine-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueName: lead.name,
          category: lead.category,
          area: lead.area,
          contactPerson: lead.contactPerson,
          currentSubject: lead.stagedDraft.subject,
          currentBody: lead.stagedDraft.body,
          instruction: "Buat email follow up santai sesama orang Bandung setelah hening beberapa hari. 25-35 kata saja, jangan buat mereka merasa bersalah, cuma tanya apakah info kemarin sempat terlewat.",
        }),
      });

      const data = await res.json();
      const newSubject = data.subject || `Kelanjutan info snack untuk ${lead.name}`;
      const newBody =
        data.body ||
        `Halo tim ${lead.name},\n\nSemoga pekan ini lancar. Menghubungi kembali siapa tahu info bitterballen dan baso goreng kami kemarin sempat terlewat.\n\nKalau sekiranya cocok untuk tambahan menu di sana dan tim dapur ingin coba testernya dulu, kabari ya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com`;

      const updated = updateStoredLeadStatus(lead.id, "staged", {
        stagedDraft: { subject: newSubject, body: newBody },
        notes: `${lead.notes || ""} [Follow-up disusun oleh Hades]`.trim(),
      });
      setLeads(updated);
      toast.success(`Draf follow-up untuk ${lead.name} siap ditinjau di Tahap 2!`);
      window.location.href = `/outbox?leadId=${lead.id}`;
    } catch {
      toast.error("Gagal menyusun draf follow-up.");
    } finally {
      setIsGeneratingFollowUp(null);
    }
  };

  const stagedCount = leads.filter((l) => l.status === "staged").length;
  const partnerCount = leads.filter((l) => l.status === "partner").length;

  return (
    <div className="content-container space-y-10">
      {/* 4-Step Pipeline Stepper */}
      <PipelineStepper
        currentStep={3}
        stats={{
          targetCount: leads.length,
          stagedCount,
          sentCount: sentLeads.length,
          dealCount: partnerCount,
        }}
      />

      {/* Header */}
      <div className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-muted-foreground">
            Tahap 3 dari 4 · Respon &amp; Penjadwalan Tester
          </span>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
            Follow-Up &amp; Respon Kafe
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Pantau status email yang sudah terkirim. Jalankan follow-up santai untuk kafe yang hening ≥ 4 hari, dan tindak lanjuti kafe yang merespon menuju kesepakatan tester atau pesanan suplai.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/outbox"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <span>← Kembali ke Draf Penawaran</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs (Underline Hairline Style) */}
      <div className="flex items-center gap-6 border-b border-border/40 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            filter === "all"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua Kafe Terkirim ({sentLeads.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("needs_action")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            filter === "needs_action"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Perlu Tindak Lanjut ({needsActionLeads.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("replied")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            filter === "replied"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Respon Masuk &amp; Tester ({repliedLeads.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("waiting")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            filter === "waiting"
              ? "border-foreground text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Menunggu Respon ({waitingLeads.length})
        </button>
      </div>

      {/* List of Leads in Follow-Up Pipeline */}
      {displayedLeads.length === 0 ? (
        <div className="py-20 text-center border-t border-b border-border/40">
          <p className="text-sm font-medium text-foreground">Belum ada kafe di kategori ini</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            {filter === "all"
              ? "Kirim draf penawaran terlebih dahulu di Tahap 2 untuk mulai melacak status dan respon kafe di sini."
              : "Tidak ada kafe yang memerlukan tindakan saat ini. Semua dalam kondisi terpantau."}
          </p>
          {filter === "all" && (
            <Link
              href="/outbox"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <span>Buka Tahap 2: Draf Penawaran</span>
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/40 border-t border-b border-border/40">
          {displayedLeads.map((lead) => {
            const aging = getLeadAgingNotice(lead);
            const isPartner = lead.status === "partner";
            const isReplied = lead.status.startsWith("replied") || lead.status === "sample_arranged";

            return (
              <div key={lead.id} className="py-7 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{lead.area}</span>
                      <span>·</span>
                      <span>{PRODUCT_LABELS[lead.targetProduct]}</span>
                    </div>
                    <h2 className="text-xl font-medium tracking-tight text-foreground">
                      {lead.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Kontak PIC: {lead.contactPerson || "Tim Purchasing / F&B"} · {lead.email} · {lead.whatsapp}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col md:items-end gap-1 shrink-0">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className={`size-1.5 rounded-full ${
                          isPartner
                            ? "bg-emerald-500"
                            : isReplied
                            ? "bg-emerald-500"
                            : aging?.isActionRequired
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="font-medium text-foreground">
                        {STATUS_CONFIG[lead.status].label}
                      </span>
                    </div>

                    {aging && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {aging.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Strip */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs">
                  {/* Quick Toggles */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground mr-1">Tandai Respon:</span>
                    <button
                      type="button"
                      onClick={() => handleSetStatus(lead.id, "replied_email")}
                      className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        lead.status === "replied_email"
                          ? "bg-foreground text-background border-foreground font-medium"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Balas Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus(lead.id, "replied_whatsapp")}
                      className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        lead.status === "replied_whatsapp"
                          ? "bg-foreground text-background border-foreground font-medium"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Balas WA/IG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus(lead.id, "sample_arranged")}
                      className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        lead.status === "sample_arranged"
                          ? "bg-foreground text-background border-foreground font-medium"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Jadwal Tester Disepakati
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStatus(lead.id, "partner")}
                      className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                        lead.status === "partner"
                          ? "bg-emerald-600 text-white border-emerald-600 font-medium"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sepakat Jadi Mitra
                    </button>
                  </div>

                  {/* Primary Next Action */}
                  <div className="flex items-center gap-3">
                    {aging?.isActionRequired && lead.status === "sent" && (
                      <button
                        type="button"
                        disabled={isGeneratingFollowUp === lead.id}
                        onClick={() => handleGenerateFollowUp(lead)}
                        className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Sparkles className="size-3" />
                        <span>
                          {isGeneratingFollowUp === lead.id
                            ? "Menyusun Draf..."
                            : "⚡ Buat Draf Follow-Up Hades"}
                        </span>
                      </button>
                    )}

                    {(isReplied || isPartner) && (
                      <Link
                        href={`/invoice/baru?leadId=${lead.id}&recipient=${encodeURIComponent(
                          lead.name
                        )}&email=${encodeURIComponent(lead.email)}&address=${encodeURIComponent(
                          lead.address || ""
                        )}&product=${lead.targetProduct}`}
                        className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <FileText className="size-3" />
                        <span>Lanjut Buat Invoice &amp; Order →</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
