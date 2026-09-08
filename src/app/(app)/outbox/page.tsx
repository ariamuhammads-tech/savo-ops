"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Check,
  Copy,
  CheckCircle2,
  Paperclip,
  ImageIcon,
  Plus,
  X,
  Sparkles,
  Wand2,
  Loader2,
  Camera,
} from "lucide-react";
import { INITIAL_LEADS, Lead, PRODUCT_LABELS } from "@/lib/leads-data";
import { getStoredCatalog, CatalogItem } from "@/lib/catalog-data";
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
  const [hadesInstruction, setHadesInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    setCatalogItems(getStoredCatalog());
    const handleUpdate = () => setCatalogItems(getStoredCatalog());
    window.addEventListener("savo_catalog_updated", handleUpdate);
    return () => window.removeEventListener("savo_catalog_updated", handleUpdate);
  }, []);

  // Daily 5-email limit tracker
  const todayStr = new Date().toISOString().slice(0, 10);
  const sentTodayCount = leads.filter(
    (l) => l.status === "sent" && l.sentAt && l.sentAt.slice(0, 10) === todayStr
  ).length;

  const attachFromCatalog = (item: CatalogItem) => {
    if (!item.imageUrl) return;
    const base64Content = item.imageUrl.split(",")[1];
    const contentType =
      item.imageUrl.split(";")[0]?.replace("data:", "") || "image/jpeg";
    setAttachments((prev) => [
      ...prev,
      {
        id: `catalog-${item.id}-${Date.now()}`,
        filename: item.imageName || `${item.id}.jpg`,
        content: base64Content,
        contentType,
        sizeKb: item.imageSizeKb || 120,
      },
    ]);
    toast.success(`Foto ${item.name} dilampirkan dari katalog!`);
    setShowCatalogPicker(false);
  };

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

  const handleRefine = async (action: "touch1" | "touch2" | "shorten" | "custom", customPrompt?: string) => {
    setIsRefining(true);
    try {
      const res = await fetch("/api/hades/refine-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: currentLead.name,
          leadArea: currentLead.area,
          targetProduct: PRODUCT_LABELS[currentLead.targetProduct],
          currentSubject: subject,
          currentBody: body,
          action,
          instruction: customPrompt || hadesInstruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui draf.");

      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);

      const label =
        action === "touch1"
          ? "Touch 1 (Tasting Box Gratis)"
          : action === "touch2"
          ? "Touch 2 (Follow-Up & Margin)"
          : action === "shorten"
          ? "Draf Dipersingkat"
          : "Instruksi Kustom";

      toast.success(`Draf diperbarui oleh Hades (${label})!`);
      if (action === "custom") setHadesInstruction("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal meminta bantuan Hades.";
      toast.error(msg);
    } finally {
      setIsRefining(false);
    }
  };

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
      <div className="border-b border-border pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
              OUTBOX // STAGED EMAIL WORKSPACE
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                sentTodayCount >= 5
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              🎯 Kuota Hari Ini: {sentTodayCount}/5 Terkirim
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mt-1">
            Meja Persetujuan Draf Email Hades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Periksa dan sesuaikan draf penawaran B2B sebelum dikirim otomatis melalui thesavorium@gmail.com.
          </p>
        </div>
      </div>

      {sentTodayCount >= 5 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div>
            <p className="font-bold">Batas Sehat Outreach (5 Email / Hari) Telah Tercapai</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Anda sudah mengirim {sentTodayCount} email hari ini. Disarankan fokus menindaklanjuti balasan kafe dan pengiriman sampel tester yang masuk sebelum mengirim penawaran baru besok.
            </p>
          </div>
        </div>
      )}

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

            {/* Inline Hades AI Copilot */}
            <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Hades AI Copilot</span>
                  <span className="text-[10px] font-mono font-normal text-muted-foreground">
                    • Tulis & poles draf tanpa copas
                  </span>
                </div>
                {isRefining && (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-primary animate-pulse">
                    <Loader2 className="size-3 animate-spin" />
                    Hades sedang memproses...
                  </span>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={isRefining}
                  onClick={() => handleRefine("touch1")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium border border-border transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ⚡ Touch 1 (Tasting Box Gratis)
                </button>
                <button
                  type="button"
                  disabled={isRefining}
                  onClick={() => handleRefine("touch2")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium border border-border transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ⚡ Touch 2 (Follow-Up & Margin)
                </button>
                <button
                  type="button"
                  disabled={isRefining}
                  onClick={() => handleRefine("shorten")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium border border-border transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ⚡ Persingkat Draf
                </button>
              </div>

              {/* Custom instruction prompt */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (hadesInstruction.trim()) handleRefine("custom");
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={hadesInstruction}
                  onChange={(e) => setHadesInstruction(e.target.value)}
                  placeholder="Ketik instruksi khusus (misal: 'Sebutkan kita bisa drop jam 3 sore ke barista')..."
                  disabled={isRefining}
                  className="flex-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-sans"
                />
                <button
                  type="submit"
                  disabled={isRefining || !hadesInstruction.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  <Wand2 className="size-3" />
                  Terapkan
                </button>
              </form>
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
            <div className="space-y-2.5 pt-2 border-t border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  Lampirkan Foto Produk / Menu (Opsional)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalogPicker(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer border border-border"
                    title="Gunakan foto produk yang tersimpan di katalog"
                  >
                    <Camera className="size-3 text-primary" />
                    Ambil dari Katalog Aset
                  </button>
                  <label className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
                    <Plus className="size-3.5" />
                    File Komputer
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {attachments.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Belum ada foto yang dilampirkan. Klik <strong>Ambil dari Katalog Aset</strong> untuk melampirkan foto resmi produk tanpa perlu upload ulang.
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

      {/* Catalog Asset Picker Modal */}
      {showCatalogPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold">
                  <Camera className="size-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Pilih Foto dari Katalog Aset Savo
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Lampirkan foto resmi produk tanpa perlu upload ulang dari hard drive.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogPicker(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {catalogItems.filter((i) => i.imageUrl).length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <ImageIcon className="size-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Belum ada foto yang diunggah di Katalog Produk.
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                    Kunjungi menu Katalog & Margin untuk mengunggah foto resmi Bitterballen dan Baso Goreng sekali saja, lalu gunakan di seluruh email berikutnya.
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Buka Menu Katalog & Upload Foto Sekarang &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalogItems
                    .filter((i) => i.imageUrl)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2 flex flex-col justify-between hover:border-primary/50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="relative rounded-md overflow-hidden aspect-video bg-black/10 border border-border/80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl!}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                              {item.imageSizeKb || 0} KB
                            </span>
                          </div>
                          <div>
                            <p className="font-display text-xs font-bold text-foreground line-clamp-1">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {item.categoryTag}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => attachFromCatalog(item)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer mt-1"
                        >
                          <Plus className="size-3" />
                          Lampirkan Foto Ini
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
