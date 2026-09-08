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
  Edit3,
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
        data.subject || `Kelanjutan info snack untuk ${lead.name}`;
      const newBody =
        data.body ||
        `Halo tim ${lead.name},\n\nSemoga pekan ini lancar. Menghubungi kembali siapa tahu email penawaran bitterballen dan baso goreng kami kemarin sempat terlewat.\n\nKalau sekiranya cocok untuk tambahan menu di sana dan tim dapur ingin coba testernya dulu, kabari ya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com`;

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
    <div className="space-y-8">
      {/* Notice Ticker: Hening >= 4 Hari */}
      {needsFollowUpLeads.length > 0 && (
        <div className="py-3 border-y border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Pemberitahuan: {needsFollowUpLeads.length} Kafe Hening ≥ 4 Hari
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Kafe telah dikirimi email penawaran 4–7 hari lalu tanpa respon. Anda dapat memicu draf follow-up singkat atau menandai balasan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="#section-tracking-terkirim"
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Lihat Kafe Hening</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Staged Items List */}
      {stagedLeads.length === 0 ? (
        <div className="py-16 text-center border-y border-border">
          <CheckCircle2 className="mx-auto size-6 text-emerald-600 mb-2" />
          <p className="text-sm font-semibold text-foreground">
            Semua Draf Email Telah Disetujui
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Tidak ada antrean email tertunda saat ini. Gunakan menu Prospek untuk menambah target baru.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/40 border-t border-b border-border/40">
          {stagedLeads.map((lead, idx) => {
            const isExpanded = expandedId === lead.id;
            const isSending = sendingId === lead.id;

            return (
              <div
                key={lead.id}
                className="py-7 transition-colors"
              >
                {/* Row Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-foreground/70">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>·</span>
                        <span>{lead.area}</span>
                        <span>·</span>
                        <span>{lead.email}</span>
                      </div>
                      <h3 className="text-2xl font-normal tracking-tight text-foreground">
                        {lead.name}
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Menunggu Persetujuan
                    </span>
                  </div>

                  {/* Target Product & Subjek */}
                  <div className="pt-2 text-xs flex flex-wrap items-baseline gap-x-6 gap-y-1 text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Produk:</span>{" "}
                      <span>{PRODUCT_LABELS[lead.targetProduct]}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-medium text-foreground">Subjek:</span>
                      <span className="text-foreground">
                        &ldquo;{lead.stagedDraft.subject}&rdquo;
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Body Preview */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3.5" />
                          <span>Tutup draf email</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" />
                          <span>Baca draf email →</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-6 border-l border-foreground/20 py-2 text-[14.5px] leading-relaxed whitespace-pre-line text-foreground/90 font-sans max-w-2xl">
                        {lead.stagedDraft.body}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="size-3.5" />
                      <span>Pengirim: <span className="text-foreground font-medium">thesavorium@gmail.com</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Link
                        href={`/outbox?leadId=${lead.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Edit di Outbox</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleCopy(lead.stagedDraft.body, lead.id)}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedId === lead.id ? (
                          <>
                            <Check className="size-3.5 text-emerald-600" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSending}
                        onClick={() => handleApproveAndSend(lead)}
                        className="rounded-full bg-foreground text-background text-xs font-medium px-5 py-2 inline-flex items-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {isSending ? (
                          <>
                            <span className="size-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            <span>Mengirim via SMTP...</span>
                          </>
                        ) : (
                          <>
                            <Send className="size-3.5" />
                            <span>Setujui &amp; Kirim Email</span>
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
      <div id="section-tracking-terkirim" className="pt-8 border-t border-border space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              02 // INBOUND TRACKER
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight text-foreground mt-0.5 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Tracking Email Terkirim & Deteksi Hening ({sentLeads.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sistem menghitung hari sejak email terkirim. Jika kafe hening ≥ 4 hari, notice menyala dan Anda dapat memicu draf follow-up atau menandai balasan.
            </p>
          </div>
        </div>

        {sentLeads.length === 0 ? (
          <div className="py-12 text-center border-y border-border text-xs font-mono text-muted-foreground">
            Belum ada email yang berstatus terkirim menunggu respon.
          </div>
        ) : (
          <div className="divide-y divide-border border-t border-b border-border">
            {sentLeads.map((sent, idx) => {
              const aging = getLeadAgingNotice(sent);
              const isGenerating = isGeneratingFollowUp === sent.id;

              return (
                <div
                  key={sent.id}
                  className="py-5 space-y-3 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="font-bold text-foreground text-base">{sent.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">({sent.area})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Kontak: {sent.email} • WA: {sent.whatsapp}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        Subjek Terakhir: &ldquo;{sent.stagedDraft.subject}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-mono">
                      {aging && (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {aging.label}
                        </span>
                      )}
                      {sent.sentAt && (
                        <span className="text-[10px] text-muted-foreground">
                          Terkirim: {new Date(sent.sentAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar: Quick-Toggle Response & Hades Follow-Up */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                    {/* Quick-Toggle Response */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-[10.5px] text-muted-foreground uppercase mr-1">
                        TANDAI RESPON:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "replied_email")}
                        className="px-2.5 py-1 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[10.5px] hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        ✅ Balas Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "replied_whatsapp")}
                        className="px-2.5 py-1 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[10.5px] hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        💬 Balas WA/IG
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(sent.id, "rejected")}
                        className="px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground text-[10.5px] transition-colors cursor-pointer"
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
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-mono text-foreground border border-border hover:bg-muted/30 transition-colors"
                      >
                        <Phone className="size-3" />
                        Chat WA
                      </a>

                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleTriggerFollowUp(sent)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <span className="size-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            Meracik...
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3" />
                            <span>⚡ Hades Follow-Up</span>
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
        <div className="pt-8 border-t border-border space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                03 // PIPELINE CONVERSIONS
              </div>
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-0.5">
                <MessageSquare className="size-4 text-emerald-600" />
                Kafe Merespon & Rencana Tester ({repliedLeads.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Jadwal Curated Tasting Box
            </span>
          </div>

          <div className="divide-y divide-border border-t border-b border-border">
            {repliedLeads.map((item, idx) => (
              <div
                key={item.id}
                className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-muted-foreground">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bold text-foreground text-base">{item.name}</span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                      ● {STATUS_CONFIG[item.status]?.label || item.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 font-mono">
                    {item.area} • Kontak: {item.contactPerson} ({item.whatsapp})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== "sample_arranged" && item.status !== "partner" && (
                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, "sample_arranged")}
                      className="px-4 py-1.5 text-xs font-mono font-bold bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Package className="size-3.5" />
                      Jadwalkan Sample Drop
                    </button>
                  )}
                  {item.status === "sample_arranged" && (
                    <button
                      type="button"
                      onClick={() => handleSetStatus(item.id, "partner")}
                      className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
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
