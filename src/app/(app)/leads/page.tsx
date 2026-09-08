"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Mail,
  Plus,
  ReceiptText,
  Filter,
} from "lucide-react";
import {
  INITIAL_LEADS,
  Lead,
  BANDUNG_AREAS,
  CATEGORY_LABELS,
  STATUS_CONFIG,
  PRODUCT_LABELS,
} from "@/lib/leads-data";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("Semua Area");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

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
    const matchStatus = selectedStatus === "all" || lead.status === selectedStatus;
    return matchSearch && matchArea && matchStatus;
  });

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
        subject: `Perkenalan Savo Eats & Tester Bitterballen untuk ${newLead.name}`,
        body: `Halo Tim ${newLead.name}, salam kenal dari Aria di Savo Eats.\n\nSuka banget sama vibe dan konsistensi kafe kalian. Kami di Savo Eats memproduksi Bitterballen daging sapi Australia dan Baso Goreng siap goreng khusus untuk kafe di Bandung.\n\nBiar tim kitchen & barista bisa coba langsung, bolehkah kami kirimkan 1 Curated Tasting Box gratis minggu ini?\n\nSalam santai,\nAria — Savo Eats\nthesavorium@gmail.com`,
      },
      updatedAt: new Date().toISOString(),
    };

    setLeads([created, ...leads]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
            DATABASE // BANDUNG B2B PROSPECTS
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mt-1">
            Database Prospek Kafe Bandung
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar kafe terkurasi dengan kontak email resmi untuk penawaran suplai Bitterballen dan Baso Goreng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="size-3.5" />
          Tambah Kafe Prospek
        </button>
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
            <option value="staged">Menunggu Persetujuan (Staged)</option>
            <option value="sent">Email Terkirim</option>
            <option value="partner">Mitra Aktif</option>
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
                        PIC: {lead.contactPerson}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        {PRODUCT_LABELS[lead.targetProduct]}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/outbox?leadId=${lead.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-card hover:bg-secondary text-foreground text-[11px] font-medium transition-colors"
                      >
                        <Mail className="size-3" />
                        Draf Email
                      </Link>

                      <Link
                        href={`/invoice?customer=${encodeURIComponent(lead.name)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-card hover:bg-secondary text-muted-foreground text-[11px] font-medium transition-colors"
                        title="Buat Invoice Pasokan"
                      >
                        <ReceiptText className="size-3 text-primary" />
                        Invoice
                      </Link>
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
    </div>
  );
}
