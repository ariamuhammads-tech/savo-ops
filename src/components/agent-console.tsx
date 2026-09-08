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
      text: "Halo Aria. Saya Hades, agen marketing B2B Savo Eats untuk area Bandung. Misi saya adalah mengurasi kafe, coffee shop, dan taphouse potensial di Bandung serta menyiapkan draf email penawaran dari thesavorium@gmail.com.\n\nHarga B2B terkunci:\n• Baso Goreng: Rp 35.000 – Rp 40.000 / 10 pcs\n• Bitterballen Original: Rp 25.000 / pack\n• Bitterballen Cheese: Rp 35.000 / pack\n• Curated Free Tasting Sample: 3 Ori + 3 Cheese + 2 Baso Goreng\n\nApa instruksi kurasi kafe atau draf penawaran yang ingin kita eksplorasi?",
      timestamp: "Baru saja",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const executeCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: commandText,
      timestamp: "Baru saja",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/hades/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commandText }),
      });

      const data = await res.json();
      const replyText = data.reply || "Maaf, terjadi kendala saat memproses instruksi.";

      const agentMsg: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        sender: "agent",
        text: replyText,
        timestamp: "Baru saja",
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        sender: "agent",
        text: "Koneksi ke otak AI Hades terputus. Silakan coba lagi.",
        timestamp: "Baru saja",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    executeCommand(input);
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
