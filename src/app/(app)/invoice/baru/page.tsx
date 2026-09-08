"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Download,
  Phone,
  Building2,
  Copy,
  Check,
  RotateCcw,
  Plus,
} from "lucide-react";
import { INITIAL_LEADS, SAVO_PRICING } from "@/lib/leads-data";
import { formatIDR } from "@/lib/format";
import { InvoicePdfData } from "@/lib/invoice-pdf";
import { toast } from "sonner";

interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
}

export default function BuatInvoiceBaruPage() {
  const year = new Date().getFullYear();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form states
  const [customerName, setCustomerName] = useState(INITIAL_LEADS[0]?.name || "Pelanggan / Kafe Mitra");
  const [customerPhone, setCustomerPhone] = useState(INITIAL_LEADS[0]?.whatsapp || "0812xxxx");
  const [customerAddress, setCustomerAddress] = useState(INITIAL_LEADS[0]?.address || "Bandung");
  const [invoiceNo, setInvoiceNo] = useState(`INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"paid" | "sent">("sent");
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const [items, setItems] = useState<LineItem[]>([
    {
      id: "item-1",
      name: "Bitterballen Cheese (Pack 10 pcs)",
      qty: 5,
      unit_price: SAVO_PRICING.bitterballen_cheese.b2b_price,
    },
    {
      id: "item-2",
      name: "Baso Goreng SAVO (Pack 10 pcs Ready-to-Fry)",
      qty: 5,
      unit_price: 35000,
    },
  ]);

  const handleSelectLead = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      return;
    }
    const lead = INITIAL_LEADS.find((l) => l.id === val);
    if (lead) {
      setCustomerName(lead.name);
      setCustomerPhone(lead.whatsapp);
      setCustomerAddress(lead.address);
    }
  };

  const addItem = (name: string, price: number) => {
    setItems((prev) => [
      ...prev,
      {
        id: "item-" + Date.now() + Math.random().toString(36).slice(2, 5),
        name,
        qty: 1,
        unit_price: price,
      },
    ]);
    toast.success(`Menambahkan ${name}`);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: "name" | "qty" | "unit_price", val: string | number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, [field]: field === "qty" || field === "unit_price" ? Number(val) : val }
          : i
      )
    );
  };

  const handleReset = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setItems([]);
    setDiscount(0);
    setShipping(0);
    setInvoiceNo(`INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`);
    toast.success("Form invoice dikosongkan.");
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const total = Math.max(0, subtotal - discount + shipping);

  const handleDownloadPdf = async () => {
    if (!customerName || items.length === 0) {
      toast.error("Lengkapi nama pelanggan dan minimal satu item produk.");
      return;
    }

    setIsGeneratingPdf(true);

    const pdfData: InvoicePdfData = {
      doc_type: "invoice",
      business: {
        business_name: "SAVO",
        address: "Bandung, Jawa Barat",
        phone_wa: "081223344551",
        email: "thesavorium@gmail.com",
        instagram: "@savo.eats",
        bank_name: "BCA",
        bank_account_no: "283-091-8899",
        bank_account_name: "Aria Muhammad",
        invoice_notes: "Pembayaran transfer ke rekening BCA tertera. Konfirmasi via WA/Email.",
      },
      invoice: {
        invoice_no: invoiceNo,
        issue_date: issueDate,
        due_date: dueDate || null,
        payment_status_label: status === "paid" ? "Lunas" : "Menunggu Pembayaran",
      },
      customer: {
        name: customerName,
        business_name: customerName,
        address: customerAddress || null,
        phone_wa: customerPhone || null,
      },
      order: {
        order_no: `ORD-${invoiceNo.slice(4)}`,
        subtotal,
        discount,
        shipping,
        tax: 0,
        total,
      },
      items: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unit_price: i.unit_price,
        subtotal: i.qty * i.unit_price,
      })),
    };

    try {
      const res = await fetch("/api/invoice/render-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfData),
      });

      if (!res.ok) {
        throw new Error("Gagal merender PDF di server.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNo}-${customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`PDF Invoice ${invoiceNo} berhasil diunduh!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getSummaryText = () => {
    return (
      `*INVOICE RESMI SAVO BANDUNG*\n` +
      `No: *${invoiceNo}*\n` +
      `Kepada: *${customerName || "Pelanggan"}*\n` +
      `Tanggal: ${issueDate}\n\n` +
      `*Rincian Pesanan:*\n` +
      items.map((i) => `• ${i.name} (${i.qty} pack @ ${formatIDR(i.unit_price)}) = ${formatIDR(i.qty * i.unit_price)}`).join("\n") +
      `\n\n*Total Tagihan: ${formatIDR(total)}*\n` +
      `Status: ${status === "paid" ? "Lunas" : "Menunggu Pembayaran"}\n\n` +
      `Pembayaran Transfer Bank BCA:\n` +
      `No Rek: 283-091-8899\n` +
      `A/N: Aria Muhammad\n\n` +
      `Terima kasih atas kemitraannya dengan Savo Eats!`
    );
  };

  const handleShareWhatsApp = () => {
    const summary = getSummaryText();
    const phoneClean = (customerPhone || "").replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(summary)}`, "_blank");
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getSummaryText());
    setCopied(true);
    toast.success("Ringkasan invoice disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <Link
              href="/invoice"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Daftar Invoice</span>
            </Link>
            <span>·</span>
            <span className="text-foreground font-medium">Generator Bebas (Standalone)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
            Invoice Generator Mandiri
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Buat, bagikan via WhatsApp, dan unduh PDF invoice B2B secara bebas untuk kafe mitra, resto, atau pesanan ritel tanpa harus melalui alur penawaran.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
            title="Kosongkan form"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3 py-2 text-xs border border-border/60 text-foreground hover:border-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            <span>{copied ? "Tersalin" : "Salin Teks"}</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-2 text-xs border border-border/60 text-foreground hover:border-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Phone className="size-3 text-emerald-600" />
            <span>Kirim WA</span>
          </button>
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="px-4 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="size-3" />
            <span>{isGeneratingPdf ? "Merender..." : "Unduh PDF Resmi"}</span>
          </button>
        </div>
      </div>

      {/* Invoice Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer & Line Items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Section (Zero Card Box, Pure Hairline Datum) */}
          <div className="space-y-3 pb-6 border-b border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-foreground" />
                Data Penerima / Kafe
              </span>
              <div className="text-xs">
                <select
                  onChange={handleSelectLead}
                  className="border-b border-border/60 bg-transparent py-1 text-xs text-foreground focus:outline-hidden cursor-pointer"
                >
                  <option value="custom">-- Ketik Bebas Manual --</option>
                  {INITIAL_LEADS.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.area})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Nama Tempat / Kafe *</label>
                <input
                  type="text"
                  placeholder="Misal: Kozi Coffee Bandung"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border-b border-border/60 bg-transparent py-1.5 text-xs text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">No WhatsApp / PIC</label>
                <input
                  type="text"
                  placeholder="0812xxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border-b border-border/60 bg-transparent py-1.5 text-xs text-foreground focus:outline-hidden focus:border-foreground transition-colors"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-muted-foreground mb-1">Alamat Pengiriman</label>
              <input
                type="text"
                placeholder="Jl. Progo No. 12, Bandung"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full border-b border-border/60 bg-transparent py-1.5 text-xs text-foreground focus:outline-hidden focus:border-foreground transition-colors"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Daftar Produk ({items.length} Item)
              </span>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] text-muted-foreground mr-1">Tambah Cepat:</span>
                <button
                  type="button"
                  onClick={() => addItem("Bitterballen Original (Pack 10 pcs)", 25000)}
                  className="px-2 py-0.5 border border-border/60 hover:border-foreground text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  + Bitterballen Ori (25rb)
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Bitterballen Cheese (Pack 10 pcs)", 35000)}
                  className="px-2 py-0.5 border border-border/60 hover:border-foreground text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  + Bitterballen Cheese (35rb)
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Baso Goreng SAVO (Pack 10 pcs)", 35000)}
                  className="px-2 py-0.5 border border-border/60 hover:border-foreground text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  + Baso Goreng (35rb)
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Duo Tasting Box (3 Ori + 3 Cheese + 2 Baso)", 50000)}
                  className="px-2 py-0.5 border border-border/60 hover:border-foreground text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  + Tasting Box (50rb)
                </button>
              </div>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border-b border-border/40">
                Belum ada produk yang ditambahkan. Gunakan tombol &ldquo;Tambah Cepat&rdquo; di atas atau tambah baris kosong di bawah.
              </div>
            ) : (
              <div className="divide-y divide-border/30 border-b border-border/40">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 items-center py-2.5 text-xs"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        className="w-full bg-transparent border-b border-border/40 py-1 text-xs text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                          className="w-full bg-transparent border-b border-border/40 py-1 text-center font-mono text-xs text-foreground focus:outline-hidden focus:border-foreground"
                        />
                        <span className="text-muted-foreground text-[10px]">pack</span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step={1000}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", e.target.value)}
                        className="w-full bg-transparent border-b border-border/40 py-1 text-right font-mono text-xs text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1 cursor-pointer transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addItem("Produk Kustom Baru", 30000)}
              className="w-full py-2 border border-dashed border-border/60 hover:border-foreground text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="size-3" />
              <span>Tambah Baris Produk Kustom</span>
            </button>
          </div>
        </div>

        {/* Right Column: Parameters & Calculations (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-border/60 p-5 space-y-4 text-xs bg-surface/30">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-2">
              Parameter Tagihan
            </span>

            <div>
              <label className="block text-muted-foreground mb-1 text-[11px]">Nomor Invoice</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full border-b border-border/60 bg-transparent py-1 font-mono text-foreground font-medium focus:outline-hidden focus:border-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground mb-1 text-[11px]">Tanggal Terbit</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full border-b border-border/60 bg-transparent py-1 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 text-[11px]">Jatuh Tempo</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border-b border-border/60 bg-transparent py-1 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 text-[11px]">Status Pembayaran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "paid" | "sent")}
                className="w-full border-b border-border/60 bg-transparent py-1 text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="sent">Menunggu Pembayaran (Belum Lunas)</option>
                <option value="paid">Lunas (Sudah Dibayar)</option>
              </select>
            </div>

            {/* Calculation Totals */}
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Diskon (Rp):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 text-right border-b border-border/60 bg-transparent py-0.5 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                />
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Ongkos Kirim (Rp):</span>
                <input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-24 text-right border-b border-border/60 bg-transparent py-0.5 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                />
              </div>
              <div className="pt-3 border-t border-border/60 flex justify-between items-baseline">
                <span className="font-medium text-foreground text-sm">Total:</span>
                <span className="text-xl font-light tracking-tight text-foreground font-mono">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="w-full mt-3 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              <span>{isGeneratingPdf ? "Merender PDF..." : "Unduh File PDF Resmi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
