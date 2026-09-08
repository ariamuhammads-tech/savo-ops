"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Check,
  Copy,
  CheckCircle2,
  Paperclip,
  ImageIcon,
  Plus,
  X,
} from "lucide-react";
import { INITIAL_LEADS, Lead, PRODUCT_LABELS } from "@/lib/leads-data";
import { toast } from "sonner";

interface AttachmentItem {
  id: string;
  filename: string;
  content: string; // base64 without prefix
  contentType: string;
  sizeKb: number;
}

export default function OutboxPage() {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId") || INITIAL_LEADS[0].id;

  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Sync draft when lead changes
  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    const target = leads.find((l) => l.id === id);
    if (target) {
      setSubject(target.stagedDraft.subject);
      setBody(target.stagedDraft.body);
      setAttachments([]);
    }
  };

  // Initialize subject and body
  useState(() => {
    if (currentLead) {
      setSubject(currentLead.stagedDraft.subject);
      setBody(currentLead.stagedDraft.body);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi 2MB. Gunakan foto ringan agar tidak masuk spam.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Content = result.split(",")[1];
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            filename: file.name,
            content: base64Content,
            contentType: file.type || "image/jpeg",
            sizeKb: Math.round(file.size / 1024),
          },
        ]);
        toast.success(`Foto ${file.name} dilampirkan!`);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    setIsSending(true);

    try {
      const res = await fetch("/api/hades/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: currentLead.email,
          recipientName: currentLead.contactPerson,
          venueName: currentLead.name,
          subject,
          text: body,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim email.");

      setLeads((prev) =>
        prev.map((l) =>
          l.id === currentLead.id
            ? {
                ...l,
                status: "sent",
                sentAt: data.sentAt || new Date().toISOString(),
                stagedDraft: { subject, body },
              }
            : l
        )
      );

      toast.success(
        data.simulated
          ? `Email terverifikasi ke ${currentLead.name} (Simulasi Aman)`
          : `Email berhasil dikirim ke ${currentLead.email} via thesavorium@gmail.com`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim email.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    toast.success("Draf email disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
          OUTBOX // STAGED EMAIL WORKSPACE
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mt-1">
          Meja Persetujuan Draf Email Hades
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Periksa dan sesuaikan draf penawaran B2B sebelum dikirim otomatis melalui thesavorium@gmail.com.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Venue Selector */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-[0.1em] text-muted-foreground block">
            Pilih Target Kafe ({leads.length})
          </span>
          <div className="border border-border rounded-xl bg-card divide-y divide-border overflow-hidden">
            {leads.map((lead) => {
              const isSelected = lead.id === currentLead.id;
              const isSent = lead.status === "sent";

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => handleSelectLead(lead.id)}
                  className={`w-full text-left p-3.5 transition-colors block ${
                    isSelected
                      ? "bg-secondary/80 border-l-2 border-primary"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-foreground">
                      {lead.name}
                    </span>
                    {isSent ? (
                      <span className="text-[10px] text-blue-600 font-mono font-bold">SENT</span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-mono font-bold">STAGED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{lead.area}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Email Editor & Approval */}
        <div className="md:col-span-2 space-y-4">
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="text-xs font-semibold text-primary font-mono uppercase">
                  {PRODUCT_LABELS[currentLead.targetProduct]}
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Draf untuk {currentLead.name}
                </h3>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {currentLead.status === "sent" ? (
                  <span className="text-blue-600 font-medium">Sudah Terkirim</span>
                ) : (
                  <span className="text-amber-700 font-medium">Menunggu Persetujuan Anda</span>
                )}
              </div>
            </div>

            {/* Email Metadata */}
            <div className="rounded-lg bg-secondary/30 p-3 text-xs space-y-1.5 border border-border/50 font-mono">
              <div className="flex">
                <span className="w-16 text-muted-foreground shrink-0">From:</span>
                <span className="font-medium text-foreground">
                  Savo Eats &lt;thesavorium@gmail.com&gt;
                </span>
              </div>
              <div className="flex">
                <span className="w-16 text-muted-foreground shrink-0">To:</span>
                <span className="font-medium text-foreground">{currentLead.email}</span>
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-xs font-semibold mb-1">Subjek Email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-sans"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <label className="block text-xs font-semibold mb-1">Isi Pesan Email</label>
              <textarea
                rows={11}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-md border border-border bg-card p-3 text-xs leading-relaxed text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-sans"
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  Lampirkan Foto Produk / Menu (Opsional)
                </span>
                <label className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
                  <Plus className="size-3.5" />
                  + Pilih Foto
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {attachments.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Belum ada foto yang dilampirkan. Klik <strong>+ Pilih Foto</strong> jika ingin menyertakan foto Bitterballen atau Baso Goreng (disarankan maks. 1MB agar tidak masuk tab Spam).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-secondary/50 text-xs text-foreground font-mono"
                    >
                      <ImageIcon className="size-3.5 text-primary" />
                      <span className="max-w-[150px] truncate">{att.filename}</span>
                      <span className="text-[10px] text-muted-foreground">({att.sizeKb} KB)</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                        title="Hapus foto ini"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md bg-card hover:bg-secondary text-foreground transition-colors cursor-pointer"
              >
                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                Salin Teks
              </button>

              <button
                type="button"
                disabled={isSending || currentLead.status === "sent"}
                onClick={handleSend}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  "Mengirim via SMTP..."
                ) : currentLead.status === "sent" ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Email Sudah Terkirim
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Setujui & Kirim Email Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
