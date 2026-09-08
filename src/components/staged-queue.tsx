"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Check,
  Mail,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Phone,
  AlertTriangle,
  MessageSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Package,
} from "lucide-react";
import {
  Lead,
  LeadStatus,
  STATUS_CONFIG,
  PRODUCT_LABELS,
  getStoredLeads,
  updateStoredLeadStatus,
  getLeadAgingNotice,
} from "@/lib/leads-data";
import { toast } from "sonner";

interface StagedQueueProps {
  initialLeads?: Lead[];
}

export function StagedQueue({ initialLeads }: StagedQueueProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState<string | null>(null);

  useEffect(() => {
    setLeads(getStoredLeads());

    const handleUpdate = () => {
      setLeads(getStoredLeads());
    };

    window.addEventListener("savo_leads_updated", handleUpdate);
    return () => window.removeEventListener("savo_leads_updated", handleUpdate);
  }, []);

  const stagedLeads = leads.filter((l) => l.status === "staged");
  const sentLeads = leads.filter((l) => l.status === "sent");
  const repliedLeads = leads.filter(
    (l) =>
      l.status === "replied_email" ||
      l.status === "replied_whatsapp" ||
      l.status === "sample_arranged"
  );
  const needsFollowUpLeads = sentLeads.filter(
    (l) => getLeadAgingNotice(l)?.isActionRequired
  );

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

      const updated = updateStoredLeadStatus(lead.id, "sent", {
        sentAt: data.sentAt || new Date().toISOString(),
      });
      setLeads(updated);

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

  const handleSetStatus = (leadId: string, newStatus: LeadStatus) => {
    const updated = updateStoredLeadStatus(leadId, newStatus);
    setLeads(updated);

    const label =
      newStatus === "replied_email"
        ? "Ditandai: Membalas via Email"
        : newStatus === "replied_whatsapp"
        ? "Ditandai: Membalas via WhatsApp / IG"
        : newStatus === "sample_arranged"
        ? "Jadwal tasting disepakati!"
        : newStatus === "rejected"
        ? "Ditandai: Belum Tertarik (Arsip)"
        : "Status diperbarui";

    toast.success(label);
  };

  const handleTriggerFollowUp = async (lead: Lead) => {
    setIsGeneratingFollowUp(lead.id);
    try {
      toast.info(`Hades meracik gentle follow-up untuk ${lead.name}...`);

      const res = await fetch("/api/hades/refine-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: lead.name,
          leadArea: lead.area,
          targetProduct: PRODUCT_LABELS[lead.targetProduct],
          currentSubject: lead.stagedDraft.subject,
          currentBody: lead.stagedDraft.body,
          action: "followup",
        }),
      });

      const data = await res.json();
      const newSubject =
        data.subject || `Tester Tasting Box Savo Eats untuk tim ${lead.name}`;
      const newBody =
        data.body ||
        `Halo tim ${lead.name},\n\nCuma mau make sure email tester box kami kemarin sempat terbaca atau mungkin nyasar ke tab promosi.\n\nKami masih simpan slot 1 Curated Tasting Box gratis (isi Bitterballen & Baso Goreng) buat dicicipi barista lead atau tim dapur kalian minggu ini. Boleh kami antar testernya besok atau lusa?\n\nCheers,\nHades | Savo Eats\nthesavorium@gmail.com`;

      const updated = updateStoredLeadStatus(lead.id, "staged", {
        stagedDraft: { subject: newSubject, body: newBody },
        notes: `${lead.notes || ""} [Follow-up diajukan setelah hening]`.trim(),
      });
      setLeads(updated);
      setExpandedId(lead.id);

      toast.success(
        `Draf follow-up untuk ${lead.name} berhasil disusun dan masuk antrean persetujuan!`
      );
    } catch {
      toast.error("Gagal menyusun draf follow-up.");
    } finally {
      setIsGeneratingFollowUp(null);
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
      {/* Notice Banner: Hening >= 4 Hari (Perlu Follow-up) */}
      {needsFollowUpLeads.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-400 bg-amber-500/10 dark:bg-amber-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-amber-900 dark:text-amber-200">
                  Notice Hades: {needsFollowUpLeads.length} Kafe Belum Membalas (Hening ≥ 4 Hari)
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  Perlu Nudge
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                Kafe-kafe ini telah dikirimkan email penawaran sample tester 4–7 hari lalu tanpa respon. Anda dapat memicu draf *gentle follow-up* otomatis atau menandai jika mereka telah membalas via WA/Email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="#section-tracking-terkirim"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              Lihat Kafe Hening
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}

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

      {/* Section 2: Riwayat Email Terkirim & Tracking Notice */}
      <div id="section-tracking-terkirim" className="pt-6 border-t border-border space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Tracking Email Terkirim & Deteksi Hening ({sentLeads.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sistem menghitung hari sejak email terkirim. Jika kafe hening ≥ 4 hari, notice menyala dan Anda dapat memicu draf follow-up atau menandai balasan.
            </p>
          </div>
        </div>

        {sentLeads.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Belum ada email yang berstatus terkirim menunggu respon.
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            {sentLeads.map((sent) => {
              const aging = getLeadAgingNotice(sent);
              const isGenerating = isGeneratingFollowUp === sent.id;

              return (
                <div
                  key={sent.id}
                  className={`p-4 space-y-3 transition-colors ${
                    aging?.isActionRequired
                      ? "bg-amber-500/5 hover:bg-amber-500/10"
                      : "hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{sent.name}</span>
                        <span className="text-xs text-muted-foreground">({sent.area})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kontak: {sent.email} • WA: {sent.whatsapp}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        Subjek Terakhir: &ldquo;{sent.stagedDraft.subject}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {aging && (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md border ${aging.badgeClass}`}
                        >
                          {aging.label}
                        </span>
                      )}
                      {sent.sentAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Terkirim: {new Date(sent.sentAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar: Quick-Toggle Response & Hades Follow-Up */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                    {/* Quick-Toggle Response (Opsi A) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium mr-1">
                        Tandai Respon:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "replied_email")}
                        className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        ✅ Balas via Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "replied_whatsapp")}
                        className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        💬 Balas via WA/IG
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "rejected")}
                        className="px-2.5 py-1 rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground text-[11px] transition-colors cursor-pointer"
                      >
                        ❌ Belum Tertarik
                      </button>
                    </div>

                    {/* Follow-up Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/62${sent.whatsapp.replace(/\D/g, "").replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-md bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="size-3" />
                        Chat WA
                      </a>

                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleTriggerFollowUp(sent)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          aging?.isActionRequired
                            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs animate-pulse"
                            : "bg-secondary hover:bg-secondary/80 text-foreground"
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Meracik...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3 text-amber-200" />
                            ⚡ Hades Follow-Up
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Respon Masuk & Jadwal Tester */}
      {repliedLeads.length > 0 && (
        <div className="pt-6 border-t border-border space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <MessageSquare className="size-4 text-emerald-600" />
              Kafe Merespon & Rencana Tester ({repliedLeads.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Tindak lanjuti jadwal pengiriman Curated Tasting Box
            </span>
          </div>

          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            {repliedLeads.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{item.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        STATUS_CONFIG[item.status]?.badgeClass || ""
                      }`}
                    >
                      {STATUS_CONFIG[item.status]?.label || item.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {item.area} • Kontak: {item.contactPerson} ({item.whatsapp})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== "sample_arranged" && item.status !== "partner" && (
                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, "sample_arranged")}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Package className="size-3.5" />
                      📦 Jadwalkan Sample Drop
                    </button>
                  )}
                  {item.status === "sample_arranged" && (
                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, "partner")}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    >
                      🤝 Konfirmasi Jadi Mitra Aktif
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
