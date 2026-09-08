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
    <div className="space-y-4">
      {/* Console Header */}
      <div className="border-t border-b border-border py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Konsol Asisten Hades</span>
          <span>·</span>
          <span className="font-mono text-[11.5px]">thesavorium@gmail.com</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Siap</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="max-h-80 overflow-y-auto py-3 space-y-4 text-sm pr-2">
        {messages.map((m) => (
          <div key={m.id}>
            {m.sender === "agent" ? (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-medium text-foreground">Hades</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="pl-4 border-l-2 border-foreground/30 py-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90 font-sans">
                  {m.text}
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-right">
                <div className="text-xs text-muted-foreground flex items-center justify-end gap-2">
                  <span>{m.timestamp}</span>
                  <span>·</span>
                  <span className="font-medium text-foreground">Aria</span>
                </div>
                <div className="pr-4 border-r-2 border-muted-foreground/40 py-1 whitespace-pre-line text-sm leading-relaxed text-foreground font-sans">
                  {m.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Command Presets */}
      <div className="py-2.5 border-t border-border flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Saran Cepat:</span>
        <button
          type="button"
          onClick={() => executeCommand("Rekomendasikan kafe di Riau & Dago untuk Bitterballen")}
          className="text-foreground hover:underline cursor-pointer border border-border px-2.5 py-1 hover:bg-secondary/40 transition-colors"
        >
          Kafe Riau &amp; Dago
        </button>
        <button
          type="button"
          onClick={() => executeCommand("Hitung unit economics dan margin kafe untuk semua produk SAVO")}
          className="text-foreground hover:underline cursor-pointer border border-border px-2.5 py-1 hover:bg-secondary/40 transition-colors"
        >
          Simulasi Margin (50%+)
        </button>
        <button
          type="button"
          onClick={() => executeCommand("Jelaskan strategi porsi Free Tasting Sample")}
          className="text-foreground hover:underline cursor-pointer border border-border px-2.5 py-1 hover:bg-secondary/40 transition-colors"
        >
          Strategi Porsi Tester
        </button>
      </div>

      {/* Command Input Bar */}
      <form onSubmit={handleSubmit} className="border-t border-b border-border py-2 flex items-center gap-3">
        <span className="text-muted-foreground select-none text-sm">&rarr;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik instruksi ke Hades (misal: 'Cari kafe di Setiabudhi', 'Hitung HPP porsi kafe')..."
          className="flex-1 bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden font-sans"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-foreground text-background text-xs font-medium px-4 py-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {isLoading ? "Memproses..." : "Kirim"}
        </button>
      </form>
    </div>
  );
}
