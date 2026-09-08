"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Copy,
  Check,
  Building2,
  Phone,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { INITIAL_LEADS, PRODUCT_LABELS } from "@/lib/leads-data";
import {
  generatePitchText,
  buildWhatsAppLink,
  PitchType,
  PITCH_TYPES,
} from "@/lib/outreach-generator";

export default function OutreachStudioPage() {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get("leadId") || INITIAL_LEADS[0].id;

  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId);
  const [pitchType, setPitchType] = useState<PitchType>("free_tester");
  const [pitchContent, setPitchContent] = useState("");
  const [copied, setCopied] = useState(false);

  const currentLead =
    INITIAL_LEADS.find((l) => l.id === selectedLeadId) || INITIAL_LEADS[0];

  useEffect(() => {
    if (currentLead) {
      setPitchContent(generatePitchText(currentLead, pitchType));
    }
  }, [currentLead, pitchType]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPitchContent(generatePitchText(currentLead, pitchType));
  };

  const wordCount = pitchContent.trim() ? pitchContent.trim().split(/\s+/).length : 0;
  const waUrl = buildWhatsAppLink(currentLead.whatsapp, pitchContent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
          SAVO Ops • B2B Acquisition
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">
          Studio Outreach & Pitch WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">
          Generator pesan penawaran kemitraan B2B anti-slop F&B Indonesia dengan tombol 1-klik buka WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead & Pitch Settings */}
        <div className="space-y-5">
          {/* Target Venue Selector */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Building2 className="size-4 text-primary" />
              Pilih Target Kafe / Resto
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Database Kafe Bandung
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {INITIAL_LEADS.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.area})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Details card */}
              <div className="rounded-xl bg-secondary/40 p-3.5 text-xs space-y-1.5 border border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Produk:</span>
                  <span className="font-semibold text-primary">
                    {PRODUCT_LABELS[currentLead.targetProduct]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kontak / PIC:</span>
                  <span className="font-medium text-foreground">
                    {currentLead.contactPerson}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <span className="font-medium text-foreground">{currentLead.whatsapp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lokasi:</span>
                  <span className="font-medium text-foreground">{currentLead.area}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pitch Strategy */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Sliders className="size-4 text-primary" />
              Tipe Penawaran
            </h3>

            <div className="space-y-2">
              {PITCH_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPitchType(pt.id)}
                  className={`w-full text-left rounded-xl p-3 border transition-all ${
                    pitchType === pt.id
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-secondary/30 hover:bg-secondary"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      pitchType === pt.id ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {pt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{pt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Pitch Editor & Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Draf WhatsApp Tergenerate</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Siap kirim ke {currentLead.name} ({currentLead.whatsapp})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="size-3" />
                  Anti-Slop Verified
                </span>
                <span className="text-muted-foreground font-mono">{wordCount} kata</span>
              </div>
            </div>

            {/* Editable Pitch Area */}
            <div className="relative">
              <textarea
                rows={13}
                value={pitchContent}
                onChange={(e) => setPitchContent(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/30 p-4 font-sans text-sm leading-relaxed text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <RefreshCw className="size-3.5" />
                Reset ke Draf Asli
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      Tersalin ke Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Salin Teks
                    </>
                  )}
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <Phone className="size-4" />
                  Buka di WhatsApp
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Value Highlights for Owner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
              <p className="text-xs font-bold text-foreground">Free Sample Hook</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pemilik kafe tidak menolak tester gratis. Peluang dicoba meningkat 80% dibanding langsung jualan.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
              <p className="text-xs font-bold text-foreground">Highlight Margin 40-50%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Bisnis kafe butuh menu dengan food cost rendah dan margin tinggi untuk menutup biaya sewa & operasional.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5">
              <p className="text-xs font-bold text-foreground">Zero Waste & No Chef</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cukup digoreng 3-5 menit oleh barista saat ada order, tanpa perlu masak dari bahan mentah.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
