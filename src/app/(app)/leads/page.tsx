"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Mail,
  Plus,
  ReceiptText,
  Filter,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  MessageSquare,
  Phone,
} from "lucide-react";
import {
  Lead,
  LeadStatus,
  BANDUNG_AREAS,
  CATEGORY_LABELS,
  STATUS_CONFIG,
  PRODUCT_LABELS,
  getStoredLeads,
  saveStoredLeads,
  updateStoredLeadStatus,
  getLeadAgingNotice,
} from "@/lib/leads-data";
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("Semua Area");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState<string | null>(null);

  useEffect(() => {
    setLeads(getStoredLeads());

    const handleUpdate = () => setLeads(getStoredLeads());
    window.addEventListener("savo_leads_updated", handleUpdate);
    return () => window.removeEventListener("savo_leads_updated", handleUpdate);
  }, []);

  // Hades Scout States
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [scoutArea, setScoutArea] = useState<string>("Dago / Dipatiukur");
  const [isScouting, setIsScouting] = useState(false);
  const [scoutCandidates, setScoutCandidates] = useState<ScoutCandidate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [expandedDraftIndex, setExpandedDraftIndex] = useState<number | null>(null);

  // Daily 5-email limit tracker
  const todayStr = new Date().toISOString().slice(0, 10);
  const sentTodayCount = leads.filter(
    (l) => l.status === "sent" && l.sentAt && l.sentAt.slice(0, 10) === todayStr
  ).length;

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

  const handleRunScout = async (area: string) => {
    setIsScouting(true);
    setExpandedDraftIndex(null);
    try {
      const res = await fetch("/api/hades/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengurasi kafe.");

      if (data.candidates && Array.isArray(data.candidates)) {
        setScoutCandidates(data.candidates);
        setSelectedIndices(data.candidates.map((_: unknown, i: number) => i));
        toast.success(`Hades berhasil mengurasi 5 kafe di ${area}!`);
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
        id: "lead-" + Date.now() + "-" + idx,
        name: c.name,
        category: c.category,
        area: c.area,
        address: c.address,
        email: c.email,
        whatsapp: c.whatsapp || "-",
        instagram: c.instagram || "-",
        contactPerson: c.contactPerson || "Barista Lead / Kitchen",
        targetProduct: c.targetProduct,
        status: "staged",
        notes: `Dikurasi otomatis oleh Hades (${c.fitReason})`,
        stagedDraft: c.stagedDraft,
        updatedAt: new Date().toISOString(),
      };
    });

    const updated = [...importedLeads, ...leads];
    saveStoredLeads(updated);
    setLeads(updated);
    setShowScoutModal(false);
    toast.success(
      `${importedLeads.length} kafe baru ditambahkan! Draf penawaran sudah siap di Outbox.`,
      {
        action: {
          label: "Buka Outbox",
          onClick: () => (window.location.href = "/outbox"),
        },
      }
    );
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) return;

    const created: Lead = {
      id: "lead-" + Date.now(),
      name: newLead.name,
      category: newLead.category,
      area: newLead.area,
      address: newLead.address || "Bandung",
      email: newLead.email,
      whatsapp: newLead.whatsapp || "08",
      instagram: newLead.instagram || "-",
      contactPerson: newLead.contactPerson || "Management",
      targetProduct: newLead.targetProduct,
      status: "staged",
      notes: newLead.notes || "Ditambahkan oleh Aria",
      stagedDraft: {
        subject: `Menu snack untuk ${newLead.name}`,
        body: `Halo tim ${newLead.name}, salam kenal.\n\nSaya Aria dari Savo Eats di Bandung. Kami bikin bitterballen daging sapi dan baso goreng siap goreng khusus untuk kafe.\n\nMenghubungi kalian siapa tahu baso goreng dan bitterballen kami cocok buat menjadi tambahan menu di sana.\n\nKalau berkenan, kabari ya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com`,
      },
      updatedAt: new Date().toISOString(),
    };

    const updated = [created, ...leads];
    saveStoredLeads(updated);
    setLeads(updated);
    setShowAddModal(false);
    toast.success(`Kafe ${created.name} berhasil ditambahkan!`);
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
        ? "Jadwal tester disepakati!"
        : newStatus === "rejected"
        ? "Ditandai: Belum Tertarik (Arsip)"
        : "Status diperbarui";
    toast.success(label);
  };

  const handleTriggerFollowUp = async (lead: Lead) => {
    setIsGeneratingFollowUp(lead.id);
    try {
      toast.info(`Hades meracik follow-up untuk ${lead.name}...`);
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
      const newSubject = data.subject || `Kelanjutan info snack untuk ${lead.name}`;
      const newBody =
        data.body ||
        `Halo tim ${lead.name},\n\nSemoga pekan ini lancar. Menghubungi kembali siapa tahu email penawaran bitterballen dan baso goreng kami kemarin sempat terlewat.\n\nKalau sekiranya cocok untuk tambahan menu di sana dan tim dapur ingin coba testernya dulu, kabari ya.\n\nSalam,\nAria | Savo Eats\nthesavorium@gmail.com`;

      const updated = updateStoredLeadStatus(lead.id, "staged", {
        stagedDraft: { subject: newSubject, body: newBody },
        notes: `${lead.notes || ""} [Follow-up diajukan setelah hening]`.trim(),
      });
      setLeads(updated);
      toast.success(`Draf follow-up untuk ${lead.name} siap ditinjau di Outbox!`, {
        action: {
          label: "Buka Outbox",
          onClick: () => (window.location.href = `/outbox?leadId=${lead.id}`),
        },
      });
    } catch {
      toast.error("Gagal menyusun draf follow-up.");
    } finally {
      setIsGeneratingFollowUp(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
              DATABASE // BANDUNG B2B PROSPECTS
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
            Database Prospek Kafe Bandung
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar kafe terkurasi dengan kontak email resmi untuk penawaran suplai Bitterballen dan Baso Goreng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowScoutModal(true);
              if (scoutCandidates.length === 0) handleRunScout(scoutArea);
            }}
            className="apple-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
          >
            <Sparkles className="size-3.5" />
            <span>Hades Scout 5 Kafe</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="apple-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium cursor-pointer active:scale-95"
          >
            <Plus className="size-3.5" />
            <span>Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama kafe atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {BANDUNG_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="all">Semua Status Email</option>
            <option value="needs_followup">⚠️ Butuh Follow-Up (Hening ≥ 4 Hari)</option>
            <option value="staged">Menunggu Persetujuan (Staged)</option>
            <option value="sent">Email Terkirim (Menunggu Respon)</option>
            <option value="replied_email">Balas via Email</option>
            <option value="replied_whatsapp">Balas via WA/IG</option>
            <option value="sample_arranged">Jadwal Tester Disepakati</option>
            <option value="partner">Mitra Aktif</option>
            <option value="rejected">Belum Tertarik / Arsip</option>
          </select>
        </div>
      </div>

      {/* Swiss Editorial Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-border">
            <thead className="bg-secondary/40 text-muted-foreground font-mono uppercase tracking-[0.1em] text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Kafe & Lokasi</th>
                <th className="py-3 px-4 font-semibold">Email Kontak</th>
                <th className="py-3 px-4 font-semibold">Target Produk</th>
                <th className="py-3 px-4 font-semibold">Status Hades</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.map((lead) => {
                const statusInfo = STATUS_CONFIG[lead.status];
                const aging = getLeadAgingNotice(lead);

                return (
                  <tr key={lead.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 space-y-0.5">
                      <p className="font-display font-bold text-foreground text-sm">
                        {lead.name}
                      </p>
                      <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <MapPin className="size-3 text-primary shrink-0" />
                        {lead.area} • {CATEGORY_LABELS[lead.category]}
                      </p>
                    </td>

                    <td className="py-3 px-4 space-y-0.5">
                      <p className="font-mono text-foreground font-medium">{lead.email}</p>
                      <p className="text-muted-foreground text-[11px]">
                        PIC: {lead.contactPerson} • {lead.whatsapp}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        {PRODUCT_LABELS[lead.targetProduct]}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${statusInfo?.badgeClass || ""}`}
                        >
                          {statusInfo?.label || lead.status}
                        </span>
                        {lead.status === "sent" && aging && (
                          <div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded border mt-0.5 ${aging.badgeClass}`}>
                              {aging.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {lead.status === "sent" && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              title="Tandai balas via email"
                              onClick={() => handleSetStatus(lead.id, "replied_email")}
                              className="px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                            >
                              ✅ Email
                            </button>
                            <button
                              type="button"
                              title="Tandai balas via WhatsApp"
                              onClick={() => handleSetStatus(lead.id, "replied_whatsapp")}
                              className="px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                            >
                              💬 WA
                            </button>
                            {aging?.isActionRequired && (
                              <button
                                type="button"
                                disabled={isGeneratingFollowUp === lead.id}
                                onClick={() => handleTriggerFollowUp(lead)}
                                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-xs animate-pulse cursor-pointer"
                                title="Rancang draf follow-up singkat via Hades"
                              >
                                ⚡ Follow-up
                              </button>
                            )}
                          </div>
                        )}

                        <Link
                          href={`/outbox?leadId=${lead.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-card hover:bg-secondary text-foreground text-[11px] font-medium transition-colors"
                        >
                          <Mail className="size-3" />
                          Draf
                        </Link>

                        <Link
                          href={`/invoice?customer=${encodeURIComponent(lead.name)}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-card hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                          title="Buat Invoice Pasokan"
                        >
                          <ReceiptText className="size-3 text-primary" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-pop animate-in fade-in duration-150 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold">Tambah Prospek Kafe Bandung</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masukkan nama kafe dan email resmi untuk kurasi Agen Hades.
              </p>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Tempat / Kafe *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sydwic Cafe"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    placeholder="partnership@kafe.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Area Bandung</label>
                  <select
                    value={newLead.area}
                    onChange={(e) => setNewLead({ ...newLead, area: e.target.value })}
                    className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    {BANDUNG_AREAS.filter((a) => a !== "Semua Area").map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">No WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                    className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Target Produk</label>
                  <select
                    value={newLead.targetProduct}
                    onChange={(e) =>
                      setNewLead({
                        ...newLead,
                        targetProduct: e.target.value as Lead["targetProduct"],
                      })
                    }
                    className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="bitterballen_ori">Bitterballen Original (Rp 25.000)</option>
                    <option value="bitterballen_cheese">Bitterballen Cheese (Rp 35.000)</option>
                    <option value="baso_goreng">Baso Goreng SAVO (Rp 35.000 - Rp 40.000)</option>
                    <option value="duo_tasting">Curated Free Tasting Sample</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-border px-3.5 py-1.5 hover:bg-secondary font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-foreground text-background px-4 py-1.5 font-bold hover:opacity-90"
                >
                  Simpan & Siapkan Draf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hades Scout Modal */}
      {showScoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    Hades AI Scout • Kurasi 5 Kafe Bandung
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Kurasi 5 kafe berpotensi tinggi per hari dengan draf email Touch 1 siap kirim.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScoutModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Area Selector & Run Button */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Pilih Area Skena Kopi Bandung:
                </label>
                <select
                  value={scoutArea}
                  onChange={(e) => setScoutArea(e.target.value)}
                  disabled={isScouting}
                  className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary font-sans"
                >
                  {BANDUNG_AREAS.filter((a) => a !== "Semua Area").map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="self-end">
                <button
                  type="button"
                  disabled={isScouting}
                  onClick={() => handleRunScout(scoutArea)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {isScouting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Hades Sedang Meriset...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-amber-300" />
                      Kurasi 5 Kafe di Area Ini
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scout Results */}
            {scoutCandidates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Ditemukan {scoutCandidates.length} Kafe Potensial di {scoutArea}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {selectedIndices.length} kafe dipilih untuk diimpor
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                  {scoutCandidates.map((c, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    const isDraftExpanded = expandedDraftIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3.5 text-xs transition-colors ${
                          isSelected
                            ? "border-primary/40 bg-primary/[0.02]"
                            : "border-border bg-secondary/20 opacity-75"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 w-full">
                            <button
                              type="button"
                              onClick={() => toggleSelectCandidate(idx)}
                              className="mt-0.5 text-primary hover:opacity-80 cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="size-4" />
                              ) : (
                                <Square className="size-4 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-display text-sm font-bold text-foreground">
                                  {c.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground font-semibold">
                                  {CATEGORY_LABELS[c.category] || c.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                📍 {c.address}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-muted-foreground font-mono">
                                <span>📧 {c.email}</span>
                                {c.instagram && <span>📸 {c.instagram}</span>}
                                {c.contactPerson && <span>👤 {c.contactPerson}</span>}
                              </div>
                              <div className="mt-2 text-[11px] bg-secondary/50 p-2 rounded border border-border/50 text-foreground leading-relaxed">
                                <span className="font-semibold text-primary">Kenapa Cocok: </span>
                                {c.fitReason}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview Draft Accordion */}
                        <div className="mt-2.5 pt-2 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDraftIndex(isDraftExpanded ? null : idx)
                            }
                            className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                          >
                            {isDraftExpanded ? (
                              <>
                                <ChevronUp className="size-3" />
                                Sembunyikan Draf Touch 1
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3" />
                                Lihat Draf Email Touch 1 ({c.stagedDraft.subject})
                              </>
                            )}
                          </button>
                          {isDraftExpanded && (
                            <div className="mt-2 p-2.5 rounded bg-background border border-border text-[11px] leading-relaxed space-y-1 font-sans">
                              <p className="font-semibold text-foreground">
                                Subjek: {c.stagedDraft.subject}
                              </p>
                              <p className="text-muted-foreground whitespace-pre-line">
                                {c.stagedDraft.body}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Import Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    Otomatis masuk ke antrean Outbox untuk dikirim via thesavorium@gmail.com
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowScoutModal(false)}
                      className="px-3.5 py-1.5 text-xs rounded-md border border-border hover:bg-secondary font-medium cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={selectedIndices.length === 0}
                      onClick={handleImportScouted}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      Import {selectedIndices.length} Kafe ke Leads & Outbox
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
