"use client";

import { useState } from "react";
import {
  Send,
  Check,
  Mail,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { Lead, STATUS_CONFIG, PRODUCT_LABELS } from "@/lib/leads-data";
import { toast } from "sonner";

interface StagedQueueProps {
  initialLeads: Lead[];
}

export function StagedQueue({ initialLeads }: StagedQueueProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stagedLeads = leads.filter((l) => l.status === "staged");
  const sentLeads = leads.filter((l) => l.status === "sent");

  const handleApproveAndSend = async (lead: Lead) => {
    setSendingId(lead.id);

    try {
      const res = await fetch("/api/hades/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: lead.email,
          recipientName: lead.contactPerson,
          venueName: lead.name,
          subject: lead.stagedDraft.subject,
          text: lead.stagedDraft.body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim email.");
      }

      // Update state locally
      setLeads((prev) =>
        prev.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                status: "sent",
                sentAt: data.sentAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      toast.success(
        data.simulated
          ? `Email terverifikasi & terkirim ke ${lead.name} (Simulasi Aman)`
          : `Email penawaran berhasil dikirim ke ${lead.email}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim email.";
      toast.error(msg);
    } finally {
      setSendingId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Draf email berhasil disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-display text-xl tracking-tight text-foreground">
            Antrean Draf Email Hades (Staged Queue)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Draf email B2B tersusun otomatis. Email HANYA dikirim setelah Anda menyetujuinya.
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {stagedLeads.length} Draf Menunggu Persetujuan
        </div>
      </div>

      {/* Staged Items List */}
      {stagedLeads.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <CheckCircle2 className="mx-auto size-8 text-emerald-600 mb-2" />
          <p className="font-display text-base font-bold text-foreground">
            Semua Draf Email Sudah Disetujui
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tidak ada antrean email tertunda saat ini. Anda bisa meminta Hades menyusun draf baru untuk kafe lain.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stagedLeads.map((lead) => {
            const isExpanded = expandedId === lead.id;
            const isSending = sendingId === lead.id;

            return (
              <div
                key={lead.id}
                className="swiss-card apple-interactive overflow-hidden bg-card transition-all"
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                          {lead.area}
                        </span>
                        <span className="text-border">•</span>
                        <span className="text-xs text-muted-foreground">{lead.email}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {lead.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${
                        STATUS_CONFIG[lead.status].badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[lead.status].label}
                    </span>
                  </div>

                  {/* Target Product & Subjek */}
                  <div className="pt-2 border-t border-border/50 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-foreground">Target Produk:</span>
                      <span>{PRODUCT_LABELS[lead.targetProduct]}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-foreground shrink-0">Subjek:</span>
                      <span className="font-medium text-foreground/90">
                        {lead.stagedDraft.subject}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Body Preview */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3.5" />
                          Sembunyikan Isi Email
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" />
                          Lihat Draf Isi Email Lengkap
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-lg bg-secondary/50 border border-border/60 text-xs leading-relaxed whitespace-pre-line font-mono text-foreground/90">
                        {lead.stagedDraft.body}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span>Kirim dari: <strong className="text-foreground">thesavorium@gmail.com</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.stagedDraft.body, lead.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-card hover:bg-secondary text-foreground transition-colors"
                      >
                        {copiedId === lead.id ? (
                          <>
                            <Check className="size-3.5 text-emerald-600" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            Salin
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleApproveAndSend(lead)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSending ? (
                          <>
                            <span className="size-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Send className="size-3.5" />
                            Setujui & Kirim Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Sent Log */}
      {sentLeads.length > 0 && (
        <div className="pt-6 border-t border-border">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Riwayat Email Terkirim ({sentLeads.length})
          </h3>
          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            {sentLeads.map((sent) => (
              <div
                key={sent.id}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-foreground">{sent.name}</span>
                  <span className="text-muted-foreground ml-2">({sent.email})</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Subjek: {sent.stagedDraft.subject}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    <CheckCircle2 className="size-3" />
                    Terkirim via thesavorium@gmail.com
                  </span>
                  <a
                    href={`https://wa.me/62${sent.whatsapp.replace(/\D/g, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    <Phone className="size-3" />
                    WA Follow-Up
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
