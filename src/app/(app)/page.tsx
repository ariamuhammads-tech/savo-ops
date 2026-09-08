"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  X,
  ArrowRight,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  Lead,
  BANDUNG_AREAS,
  CATEGORY_LABELS,
  STATUS_CONFIG,
  PRODUCT_LABELS,
  getStoredLeads,
  saveStoredLeads,
  getLeadAgingNotice,
} from "@/lib/leads-data";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { HadesFloatingChat } from "@/components/hades-floating-chat";
import { toast } from "sonner";

interface ScoutCandidate {
  name: string;
  category: "coffee_shop" | "cafe_bistro" | "bar_taphouse" | "coworking" | "resto";
  area: string;
  address: string;
  email: string;
  instagram: string;
  whatsapp: string;
  contactPerson: string;
  targetProduct: "duo_tasting" | "bitterballen_ori" | "bitterballen_cheese" | "baso_goreng";
  fitReason: string;
  stagedDraft: {
    subject: string;
    body: string;
  };
}

export default function TargetKafePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("Semua Area");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Hades Scout States
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [scoutArea, setScoutArea] = useState<string>("Dago / Dipatiukur");
  const [isScouting, setIsScouting] = useState(false);
  const [scoutCandidates, setScoutCandidates] = useState<ScoutCandidate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2, 3, 4]);

  useEffect(() => {
    setLeads(getStoredLeads());

    const handleUpdate = () => setLeads(getStoredLeads());
    window.addEventListener("savo_leads_updated", handleUpdate);
    return () => window.removeEventListener("savo_leads_updated", handleUpdate);
  }, []);

  const [newLead, setNewLead] = useState({
    name: "",
    category: "coffee_shop" as Lead["category"],
    area: "Riau / RE Martadinata",
    address: "",
    email: "",
    whatsapp: "",
    instagram: "",
    contactPerson: "",
    targetProduct: "bitterballen_ori" as Lead["targetProduct"],
    notes: "",
  });

  const stagedCount = leads.filter((l) => l.status === "staged").length;
  const sentCount = leads.filter((l) => l.status === "sent").length;
  const partnerCount = leads.filter((l) => l.status === "partner").length;

  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.address.toLowerCase().includes(search.toLowerCase());
    const matchArea = selectedArea === "Semua Area" || lead.area === selectedArea;

    let matchStatus = true;
    if (selectedStatus === "needs_followup") {
      matchStatus = lead.status === "sent" && !!getLeadAgingNotice(lead)?.isActionRequired;
    } else if (selectedStatus !== "all") {
      matchStatus = lead.status === selectedStatus;
    }

    return matchSearch && matchArea && matchStatus;
  });

  const handleRunScout = async (area: string, resetExclude = false) => {
    setIsScouting(true);
    try {
      // Collect already known cafe names from existing leads & current scout candidates
      const excludeNames = resetExclude
        ? leads.map((l) => l.name)
        : Array.from(
            new Set([
              ...leads.map((l) => l.name),
              ...scoutCandidates.map((c) => c.name),
            ])
          );

      const res = await fetch("/api/hades/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, excludeNames }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengurasi kafe.");

      if (data.candidates && Array.isArray(data.candidates)) {
        setScoutCandidates(data.candidates);
        setSelectedIndices(data.candidates.map((_: unknown, i: number) => i));
        toast.success(`Hades mengurasi 5 kafe baru di ${area}!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal meminta kurasi Hades.";
      toast.error(msg);
    } finally {
      setIsScouting(false);
    }
  };

  const toggleSelectCandidate = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleImportScouted = () => {
    if (selectedIndices.length === 0) return;

    const importedLeads: Lead[] = selectedIndices.map((idx) => {
      const c = scoutCandidates[idx];
      return {
        id: `scout-${Date.now()}-${idx}`,
        name: c.name,
        category: c.category,
        area: c.area,
        address: c.address,
        email: c.email,
        instagram: c.instagram,
        whatsapp: c.whatsapp,
        contactPerson: c.contactPerson,
        targetProduct: c.targetProduct,
        notes: `[Scouted by Hades] ${c.fitReason}`,
        status: "staged",
        updatedAt: new Date().toISOString(),
        stagedDraft: {
          subject: c.stagedDraft.subject,
          body: c.stagedDraft.body,
        },
      };
    });

    const updated = [...importedLeads, ...leads];
    saveStoredLeads(updated);
    setLeads(updated);
    setShowScoutModal(false);
    setScoutCandidates([]);
    toast.success(`${importedLeads.length} kafe baru ditambahkan ke Target!`);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.email.trim()) {
      toast.error("Nama kafe dan email wajib diisi!");
      return;
    }

    const created: Lead = {
      id: `manual-${Date.now()}`,
      name: newLead.name.trim(),
      category: newLead.category,
      area: newLead.area,
      address: newLead.address.trim(),
      email: newLead.email.trim(),
      whatsapp: newLead.whatsapp.trim(),
      instagram: newLead.instagram.trim(),
      contactPerson: newLead.contactPerson.trim(),
      targetProduct: newLead.targetProduct,
      notes: newLead.notes.trim(),
      status: "staged",
      updatedAt: new Date().toISOString(),
      stagedDraft: {
        subject: `Peluang kerja sama menu camilan untuk ${newLead.name.trim()}`,
        body: `Halo tim ${newLead.name.trim()}, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe.\n\nSaya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di ${newLead.name.trim()}.\n\nProduk kami berbentuk siap goreng (zero prep), sehingga praktis disajikan dalam 3–4 menit tanpa perlu persiapan bahan mentah di dapur.\n\nJika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.\n\nTerima kasih banyak atas perhatian dan waktunya.\n\nSalam hangat,\nAria Muhammad | Savo Eats\nthesavorium@gmail.com`,
      },
    };

    const updated = [created, ...leads];
    saveStoredLeads(updated);
    setLeads(updated);
    setShowAddModal(false);
    setNewLead({
      name: "",
      category: "coffee_shop",
      area: "Riau / RE Martadinata",
      address: "",
      email: "",
      whatsapp: "",
      instagram: "",
      contactPerson: "",
      targetProduct: "bitterballen_ori",
      notes: "",
    });
    toast.success(`Kafe ${created.name} berhasil ditambahkan ke Target!`);
  };

  return (
    <div className="content-container space-y-10">
      {/* 4-Step Pipeline Stepper */}
      <PipelineStepper
        currentStep={1}
        stats={{
          targetCount: leads.length,
          stagedCount,
          sentCount,
          dealCount: partnerCount,
        }}
      />

      {/* Header */}
      <div className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-muted-foreground">
            Tahap 1 dari 4 · Penentuan Target Kafe Bandung
          </span>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
            Target Kafe Bandung
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Tentukan kafe sasaran penawaran. Klik tombol <strong className="text-foreground font-semibold">&ldquo;Siapkan Penawaran&rdquo;</strong> pada kafe yang siap untuk meninjau draf email di Tahap 2, atau cari target kafe baru via Hades Scout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setShowScoutModal(true);
              if (scoutCandidates.length === 0) handleRunScout(scoutArea);
            }}
            className="px-4 py-2 bg-foreground text-background text-xs font-medium hover:opacity-90 inline-flex items-center gap-1.5 transition-opacity cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>Hades Scout 5 Kafe</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 border border-border/60 text-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:border-foreground transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Filters (Clean Minimalist Hairline Inputs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama kafe atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-b border-border/60 bg-transparent pl-6 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-foreground transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full border-b border-border/60 bg-transparent py-2 text-xs text-foreground focus:outline-hidden focus:border-foreground transition-colors cursor-pointer"
          >
            <option value="Semua Area">Semua Area</option>
            {BANDUNG_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border-b border-border/60 bg-transparent py-2 text-xs text-foreground focus:outline-hidden focus:border-foreground transition-colors cursor-pointer"
          >
            <option value="all">Semua Status Kafe</option>
            <option value="staged">Siap Ditawari (Belum Dikirim)</option>
            <option value="sent">Sudah Dikirim (Sedang Dipantau)</option>
            <option value="partner">Mitra Aktif</option>
          </select>
        </div>
      </div>

      {/* Table: Pipeline Stage 1 List */}
      <div className="overflow-x-auto border-t border-b border-border/40">
        <table className="aura-table">
          <thead>
            <tr>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Kafe &amp; Lokasi</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Kontak PIC</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Target Produk</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground">Status Alur</th>
              <th className="py-3 px-4 text-xs font-medium text-muted-foreground text-right">Langkah Berikutnya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                  Tidak ada kafe yang cocok dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const statusInfo = STATUS_CONFIG[lead.status];
                const aging = getLeadAgingNotice(lead);
                const isReadyToSend = lead.status === "staged";
                const isSent = lead.status === "sent" || lead.status.startsWith("replied") || lead.status === "sample_arranged";
                const isPartner = lead.status === "partner";

                return (
                  <tr key={lead.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-4 space-y-0.5">
                      <p className="font-medium text-foreground text-[14px]">
                        {lead.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {lead.area} · {CATEGORY_LABELS[lead.category]}
                      </p>
                    </td>

                    <td className="py-4 px-4 space-y-1">
                      <p className="text-foreground text-xs">{lead.email}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
                        {lead.contactPerson && (
                          <span className="font-medium text-foreground">{lead.contactPerson} ·</span>
                        )}
                        {lead.whatsapp && (() => {
                          const cleanPhone = lead.whatsapp.replace(/\D/g, "").replace(/^0/, "62");
                          return (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                              title="Chat WhatsApp"
                            >
                              <MessageCircle className="size-3" />
                              <span>{lead.whatsapp}</span>
                            </a>
                          );
                        })()}
                        {lead.instagram && (
                          <a
                            href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-0.5"
                            title="Buka Profil Instagram"
                          >
                            <span>{lead.instagram}</span>
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-foreground">
                      {PRODUCT_LABELS[lead.targetProduct]}
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className={`size-1.5 rounded-full ${
                              isPartner
                                ? "bg-emerald-500"
                                : isReadyToSend
                                ? "bg-amber-500"
                                : aging?.isActionRequired
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <span>{statusInfo?.label || lead.status}</span>
                        </span>
                        {isSent && aging && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {aging.label}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        {isReadyToSend && (
                          <Link
                            href={`/outbox?leadId=${lead.id}`}
                            className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-stone-600 transition-colors whitespace-nowrap"
                          >
                            <span>Siapkan Penawaran</span>
                            <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                          </Link>
                        )}

                        {isSent && (
                          <Link
                            href="/follow-up"
                            className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-stone-600 transition-colors whitespace-nowrap"
                          >
                            <span>Pantau di Follow-Up</span>
                            <ArrowRight className="size-3 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                          </Link>
                        )}

                        {isPartner && (
                          <Link
                            href={`/invoice/baru?leadId=${lead.id}&recipient=${encodeURIComponent(lead.name)}&email=${encodeURIComponent(lead.email)}&address=${encodeURIComponent(lead.address || "")}&product=${lead.targetProduct}`}
                            className="group inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-stone-600 transition-colors whitespace-nowrap"
                          >
                            <span>Buat Invoice</span>
                            <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Scout Candidates Modal */}
      {showScoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-background border border-border/60 p-6 space-y-6 shadow-2xl animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <span className="text-xs text-muted-foreground">Kurasi Cerdas Hades</span>
                <h2 className="text-lg font-medium tracking-tight text-foreground">
                  Scout 5 Kafe di {scoutArea}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowScoutModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <select
                value={scoutArea}
                onChange={(e) => {
                  setScoutArea(e.target.value);
                  handleRunScout(e.target.value);
                }}
                className="border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden"
              >
                {BANDUNG_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isScouting}
                  onClick={() => handleRunScout(scoutArea)}
                  className="px-3 py-1 bg-secondary border border-border/60 text-foreground text-xs font-medium hover:bg-secondary/80 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Sparkles className="size-3.5" />
                  <span>{isScouting ? "Sedang Mengurasi..." : "Scout Ulang (5 Kafe Baru)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isScouting}
                  onClick={() => handleRunScout(scoutArea, true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                  title="Mulai kurasi ulang dari kelompok kafe pertama"
                >
                  Reset Putaran
                </button>
              </div>
            </div>

            {isScouting ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Hades sedang memindai direktori kafe specialty di {scoutArea}...
                </p>
              </div>
            ) : scoutCandidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Belum ada kandidat. Klik tombol di atas untuk memulai kurasi.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 divide-y divide-border/30">
                {scoutCandidates.map((c, idx) => {
                  const isChecked = selectedIndices.includes(idx);
                  return (
                    <div key={idx} className="pt-3 first:pt-0 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectCandidate(idx)}
                        className="mt-0.5 text-foreground cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="size-4 text-foreground" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                      <div className="space-y-1 flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground text-sm">{c.name}</span>
                          <span className="text-muted-foreground text-[11px]">
                            {PRODUCT_LABELS[c.targetProduct]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
                          {c.instagram && (
                            <a
                              href={`https://instagram.com/${c.instagram.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-foreground hover:underline inline-flex items-center gap-0.5 font-medium"
                            >
                              <span>{c.instagram}</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                          {c.whatsapp && (
                            <span>· WA: {c.whatsapp}</span>
                          )}
                          {c.address && (
                            <span className="text-muted-foreground/80">· {c.address}</span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted-foreground italic">&ldquo;{c.fitReason}&rdquo;</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">
                {selectedIndices.length} dari {scoutCandidates.length} kafe dipilih
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowScoutModal(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedIndices.length === 0}
                  onClick={handleImportScouted}
                  className="px-4 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  Tambahkan ke Target ({selectedIndices.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <form
            onSubmit={handleAddManual}
            className="w-full max-w-lg bg-background border border-border/60 p-6 space-y-5 shadow-2xl animate-in fade-in-50 duration-200"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <span className="text-xs text-muted-foreground">Tahap 1: Target Kafe</span>
                <h2 className="text-lg font-medium tracking-tight text-foreground">
                  Tambah Kafe Manual
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Nama Kafe *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dua Coffee Roastery"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1">Area Bandung</label>
                  <select
                    value={newLead.area}
                    onChange={(e) => setNewLead({ ...newLead, area: e.target.value })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden cursor-pointer"
                  >
                    {BANDUNG_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Kategori</label>
                  <select
                    value={newLead.category}
                    onChange={(e) => setNewLead({ ...newLead, category: e.target.value as Lead["category"] })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden cursor-pointer"
                  >
                    <option value="coffee_shop">Specialty Coffee Shop</option>
                    <option value="cafe_bistro">Brunch &amp; Bistro</option>
                    <option value="bar_taphouse">Bar &amp; Taphouse</option>
                    <option value="coworking">Coworking Cafe</option>
                    <option value="resto">Resto &amp; Lounge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    placeholder="partnership@kafe.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">WhatsApp / Telepon</label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1">Nama PIC (Purchasing/Owner)</label>
                  <input
                    type="text"
                    placeholder="Misal: Mas Dimas / Tim Barista"
                    value={newLead.contactPerson}
                    onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Target Produk</label>
                  <select
                    value={newLead.targetProduct}
                    onChange={(e) => setNewLead({ ...newLead, targetProduct: e.target.value as Lead["targetProduct"] })}
                    className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden cursor-pointer"
                  >
                    <option value="bitterballen_ori">Bitterballen Original</option>
                    <option value="bitterballen_cheese">Bitterballen Cheese</option>
                    <option value="baso_goreng">Baso Goreng SAVO</option>
                    <option value="duo_tasting">Duo Tasting Box</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
              >
                Simpan &amp; Lanjut ke Penawaran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Hades B2B Chatbot Trigger & Drawer */}
      <HadesFloatingChat />
    </div>
  );
}
