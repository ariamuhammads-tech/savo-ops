"use client";

import { useState } from "react";
import {
  Coffee,
  Mail,
  TrendingUp,
} from "lucide-react";
import { SAVO_PRICING } from "@/lib/leads-data";

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  timestamp: string;
}

export function AgentConsole() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "agent",
      text: "Halo Aria. Saya Hades, agen marketing B2B SAVO untuk area Bandung. Misi saya adalah mengurasi kafe, coffee shop, dan taphouse potensial di Bandung serta menyiapkan draf email penawaran dari thesavorium@gmail.com.\n\nHarga B2B terkunci:\n• Baso Goreng: Rp 35.000 – Rp 40.000 / 10 pcs\n• Bitterballen Original: Rp 25.000 / pack\n• Bitterballen Cheese: Rp 35.000 / pack\n• Curated Free Tasting Sample: 3 Ori + 3 Cheese + 2 Baso Goreng\n\nApa instruksi kurasi atau draf yang ingin kita jalankan?",
      timestamp: "Baru saja",
    },
  ]);
  const [input, setInput] = useState("");

  const executeCommand = (commandText: string) => {
    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: commandText,
      timestamp: "Baru saja",
    };

    let replyText = "";
    const lower = commandText.toLowerCase();

    if (lower.includes("riau") || lower.includes("dago") || lower.includes("rekomendasi")) {
      replyText =
        "Rekomendasi Kafe Prioritas di Koridor Riau & Dago (Sesuai Kriteria Tiket Menu):\n\n" +
        "1. **Wheels Coffee Roasters** (Jl. LLRE Martadinata No.65)\n" +
        "   • Target: Bitterballen Cheese (Rp 35.000/pack). Margin kafe 55% pada harga jual Rp 38.000/porsi.\n" +
        "   • Status: Draf email sudah siap di antrean Staged.\n\n" +
        "2. **Sejiwa Coffee** (Jl. Progo No.15)\n" +
        "   • Target: Bitterballen Original (Rp 25.000/pack). Porsi 5 pcs = HPP Rp 12.500, jual Rp 32.000.\n" +
        "   • Status: Draf email siap di antrean Staged.\n\n" +
        "3. **Blue Doors** (Jl. Alkateri / Golf Barat)\n" +
        "   • Target: Curated Tasting Box (Ori & Cheese). Pelanggan artisan coffee.\n\n" +
        "Anda dapat langsung meninjau draf email dan mengklik [Setujui & Kirim] di panel atas.";
    } else if (lower.includes("margin") || lower.includes("hitung") || lower.includes("harga")) {
      replyText =
        "Perhitungan Unit Economics & Margin Kafe (Berdasarkan Harga Baku SAVO):\n\n" +
        "1. **Bitterballen Original (Signature Beef):**\n" +
        `   • Harga B2B: Rp ${SAVO_PRICING.bitterballen_ori.b2b_price.toLocaleString("id-ID")} / pack (10 pcs)\n` +
        `   • Porsi Kafe: 5 pcs (HPP bahan = Rp ${SAVO_PRICING.bitterballen_ori.hpp_per_portion.toLocaleString("id-ID")})\n` +
        `   • Rekomendasi Jual Kafe: Rp ${SAVO_PRICING.bitterballen_ori.recommended_sell_price.toLocaleString("id-ID")}\n` +
        `   • Laba Bersih Kafe: Rp ${(SAVO_PRICING.bitterballen_ori.recommended_sell_price - SAVO_PRICING.bitterballen_ori.hpp_per_portion).toLocaleString("id-ID")} (${SAVO_PRICING.bitterballen_ori.margin_percent})\n\n` +
        "2. **Bitterballen Cheese (Australian Beef + Keju):**\n" +
        `   • Harga B2B: Rp ${SAVO_PRICING.bitterballen_cheese.b2b_price.toLocaleString("id-ID")} / pack (10 pcs)\n` +
        `   • Porsi Kafe: 5 pcs (HPP bahan = Rp ${SAVO_PRICING.bitterballen_cheese.hpp_per_portion.toLocaleString("id-ID")})\n` +
        `   • Rekomendasi Jual Kafe: Rp ${SAVO_PRICING.bitterballen_cheese.recommended_sell_price.toLocaleString("id-ID")}\n` +
        `   • Laba Bersih Kafe: Rp ${(SAVO_PRICING.bitterballen_cheese.recommended_sell_price - SAVO_PRICING.bitterballen_cheese.hpp_per_portion).toLocaleString("id-ID")} (${SAVO_PRICING.bitterballen_cheese.margin_percent})\n\n` +
        "3. **Baso Goreng SAVO (Ready-to-Fry):**\n" +
        `   • Harga B2B: ${SAVO_PRICING.baso_goreng.b2b_price_range}\n` +
        `   • Porsi Kafe: 3 pcs potong serong (HPP = Rp ${SAVO_PRICING.baso_goreng.hpp_per_portion.toLocaleString("id-ID")})\n` +
        `   • Rekomendasi Jual: Rp ${SAVO_PRICING.baso_goreng.recommended_sell_price.toLocaleString("id-ID")}\n` +
        `   • Laba Bersih Kafe: Rp ${(SAVO_PRICING.baso_goreng.recommended_sell_price - SAVO_PRICING.baso_goreng.hpp_per_portion).toLocaleString("id-ID")} (${SAVO_PRICING.baso_goreng.margin_percent})\n\n` +
        "Kesimpulan komersial: Semua produk SAVO memberikan margin 53% - 62% bagi kafe mitra.";
    } else if (lower.includes("sample") || lower.includes("tester")) {
      replyText =
        "Format Paket Sample Bebas Biaya (Curated Free Tasting Box):\n\n" +
        `Komposisi: ${SAVO_PRICING.sample_pack.contents}\n\n` +
        "Alasan Strategis: Porsi kurasi ini sengaja tidak dibuat sebanyak kemasan penuh agar efisien bagi SAVO, namun memberikan sampel representatif yang cukup dicicipi oleh owner, head kitchen, dan barista lead.\n\n" +
        "Penawaran ini disematkan pada setiap draf email penawaran B2B.";
    } else {
      replyText =
        `Instruksi dicatat: "${commandText}".\n\n` +
        "Saya terus memantau antrean draf email B2B dari thesavorium@gmail.com. Silakan tinjau draf di antrean Staged dan klik tombol kirim kapan pun Anda siap.";
    }

    const agentMsg: ChatMessage = {
      id: "msg-" + (Date.now() + 1),
      sender: "agent",
      text: replyText,
      timestamp: "Baru saja",
    };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input.trim());
  };

  return (
    <div className="swiss-card overflow-hidden bg-card">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background font-mono text-xs font-bold">
            HD
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-tight text-foreground">
              Konsol Perintah Agen Hades
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Online • thesavorium@gmail.com • Bandung B2B Acquisition
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "agent" && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-primary font-mono text-[10px] font-bold">
                HD
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg p-3.5 leading-relaxed ${
                m.sender === "user"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-secondary/60 text-foreground border border-border/80"
              }`}
            >
              <div className="whitespace-pre-line font-sans">{m.text}</div>
              <div
                className={`mt-1.5 text-[10px] text-right ${
                  m.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {m.timestamp}
              </div>
            </div>
            {m.sender === "user" && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background font-mono text-[10px] font-bold">
                AM
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Command Buttons (Swiss monoline style) */}
      <div className="border-t border-border px-4 py-2 bg-secondary/20 flex gap-2 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => executeCommand("Rekomendasikan kafe di Riau & Dago untuk Bitterballen")}
          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 border border-border rounded-md bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Coffee className="size-3" />
          Rekomendasi Riau & Dago
        </button>
        <button
          type="button"
          onClick={() => executeCommand("Hitung unit economics dan margin kafe untuk semua produk SAVO")}
          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 border border-border rounded-md bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <TrendingUp className="size-3" />
          Simulasi Margin Kafe (50%+)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("Jelaskan strategi porsi Free Tasting Sample")}
          className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1 border border-border rounded-md bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="size-3" />
          Detail Porsi Sample Tester
        </button>
      </div>

      {/* Command Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2 bg-card">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik instruksi untuk Hades (misal: 'Cari kafe di Setiabudhi', 'Hitung HPP porsi kafe')..."
          className="flex-1 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold rounded-md bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
        >
          Kirim Perintah
        </button>
      </form>
    </div>
  );
}
