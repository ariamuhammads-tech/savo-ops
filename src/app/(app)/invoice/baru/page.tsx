"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Download,
  Phone,
  Building2,
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
  const [customerName, setCustomerName] = useState(INITIAL_LEADS[0].name);
  const [customerPhone, setCustomerPhone] = useState(INITIAL_LEADS[0].whatsapp);
  const [customerAddress, setCustomerAddress] = useState(INITIAL_LEADS[0].address);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"paid" | "sent">("sent");
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    const lead = INITIAL_LEADS.find((l) => l.id === e.target.value);
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

  const handleShareWhatsApp = () => {
    const summary =
      `*INVOICE RESMI SAVO BANDUNG*\n` +
      `No: *${invoiceNo}*\n` +
      `Kepada: *${customerName}*\n` +
      `Tanggal: ${issueDate}\n\n` +
      `*Rincian Pesanan:*\n` +
      items.map((i) => `• ${i.name} (${i.qty} pack @ ${formatIDR(i.unit_price)}) = ${formatIDR(i.qty * i.unit_price)}`).join("\n") +
      `\n\n*Total Tagihan: ${formatIDR(total)}*\n` +
      `Status: ${status === "paid" ? "Lunas" : "Menunggu Pembayaran"}\n\n` +
      `Pembayaran Transfer Bank BCA:\n` +
      `No Rek: 283-091-8899\n` +
      `A/N: Aria Muhammad\n\n` +
      `Terima kasih atas kemitraannya dengan SAVO Bandung!`;

    const phoneClean = (customerPhone || "").replace(/\D/g, "").replace(/^0/, "62");
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(summary)}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <Link
            href="/invoice"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke Daftar Invoice
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Generator Invoice B2B Mandiri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Terbitkan invoice resmi SAVO langsung untuk kafe mitra tanpa alur pencatatan rumit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-secondary text-foreground transition-colors cursor-pointer"
          >
            <Phone className="size-3.5 text-emerald-600" />
            Kirim Rangkuman WA
          </button>
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              "Merender PDF..."
            ) : (
              <>
                <Download className="size-3.5" />
                Unduh PDF Resmi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Form Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Line Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Data Kafe / Pelanggan
            </h2>

            <div>
              <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                Pilih dari Database Hades (Atau Ketik Baru)
              </label>
              <select
                onChange={handleSelectLead}
                className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                {INITIAL_LEADS.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.area})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Tempat / Kafe</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">No WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Alamat Pengiriman</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Line Items Card */}
          <div className="border border-border rounded-xl bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <h2 className="font-display text-base font-bold text-foreground">
                Rincian Produk B2B
              </h2>

              {/* 1-Click Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => addItem("Bitterballen Original (Pack 10 pcs)", 25000)}
                  className="px-2.5 py-1 border border-border rounded hover:bg-secondary text-primary font-semibold"
                >
                  + Bitterballen Ori (25rb)
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Bitterballen Cheese (Pack 10 pcs)", 35000)}
                  className="px-2.5 py-1 border border-border rounded hover:bg-secondary text-primary font-semibold"
                >
                  + Bitterballen Cheese (35rb)
                </button>
                <button
                  type="button"
                  onClick={() => addItem("Baso Goreng SAVO (Pack 10 pcs)", 35000)}
                  className="px-2.5 py-1 border border-border rounded hover:bg-secondary text-primary font-semibold"
                >
                  + Baso Goreng (35rb)
                </button>
              </div>
            </div>

            {/* Table of items */}
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg border border-border/70 bg-secondary/20 text-xs"
                >
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      className="w-full rounded border border-border/80 bg-card px-2.5 py-1.5 font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                      className="w-full rounded border border-border/80 bg-card px-2 py-1.5 text-center font-mono"
                      title="Kuantitas Pack"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step={1000}
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", e.target.value)}
                      className="w-full rounded border border-border/80 bg-card px-2 py-1.5 text-right font-mono"
                      title="Harga Satuan (Rp)"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addItem("Item Produk Kustom", 30000)}
                className="w-full py-2 border border-dashed border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
              >
                + Tambah Baris Produk Baru
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Specs & Total */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="border border-border rounded-xl bg-card p-5 space-y-3.5 text-xs">
            <h3 className="font-display text-sm font-bold text-foreground">Parameter Invoice</h3>

            <div>
              <label className="block text-[11px] font-semibold mb-1 text-muted-foreground">
                Nomor Invoice
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full rounded border border-border bg-card px-2.5 py-1.5 font-mono font-bold text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-muted-foreground">
                  Tanggal Terbit
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded border border-border bg-card px-2 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-muted-foreground">
                  Jatuh Tempo (Opsional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded border border-border bg-card px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1 text-muted-foreground">
                Status Pembayaran
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "paid" | "sent")}
                className="w-full rounded border border-border bg-card px-2.5 py-1.5 font-medium"
              >
                <option value="sent">Menunggu Pembayaran (Belum Lunas)</option>
                <option value="paid">Lunas (Sudah Dibayar)</option>
              </select>
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground font-medium">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Diskon / Potongan:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 text-right rounded border border-border px-1.5 py-0.5 font-mono text-foreground"
                />
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Ongkos Kirim:</span>
                <input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-24 text-right rounded border border-border px-1.5 py-0.5 font-mono text-foreground"
                />
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="font-display font-bold text-foreground text-sm">Total Tagihan:</span>
                <span className="font-display text-xl font-bold text-primary">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="w-full mt-3 py-2.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              Unduh File PDF Resmi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
