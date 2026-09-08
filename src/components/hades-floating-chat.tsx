"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { CerberusIcon } from "@/components/cerberus-icon";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "hades" | "user";
  text: string;
  timestamp: string;
}

const SUGGESTIONS = [
  "Cari 3 kafe specialty di Dago",
  "Simulasi margin Baso Goreng",
  "Tips follow-up kafe hening 4 hari",
];

export function HadesFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "hades",
      text: "Halo Aria. Saya Hades, asisten B2B Savo Eats. Tanyakan kurasi kafe sasaran baru di Bandung, rincian margin grosir, atau rancangan draf outreach santai.",
      timestamp: "Baru saja",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/hades/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const replyText = data.reply || "Maaf, Hades sedang kesulitan memproses respon saat ini.";

      const hadesMessage: ChatMessage = {
        id: `hades-${Date.now()}`,
        sender: "hades",
        text: replyText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, hadesMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `hades-err-${Date.now()}`,
          sender: "hades",
          text: "Koneksi ke otak Hades terputus. Pastikan koneksi internet stabil lalu coba lagi.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right, adjusted for mobile bottom navigation) */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] right-4 md:bottom-8 md:right-8 z-40 flex items-center gap-2">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 bg-background border border-border/80 hover:border-foreground text-foreground px-3.5 py-2.5 shadow-xl transition-all cursor-pointer select-none"
            aria-label="Buka Chat Hades"
          >
            <CerberusIcon className="size-5 text-foreground transition-transform group-hover:scale-110" />
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-foreground">
                <span>Hades AI</span>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10.5px] text-muted-foreground">Asisten B2B</p>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-end md:items-end pointer-events-none p-0 md:p-8">
          {/* Backdrop on mobile */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-xs md:hidden pointer-events-auto"
          />

          {/* Chat Box Container */}
          <div className="pointer-events-auto relative w-full h-[85vh] md:h-[520px] md:w-[390px] bg-background border border-border/80 shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-2.5">
                <div className="size-8 bg-foreground text-background flex items-center justify-center">
                  <CerberusIcon className="size-5 text-background" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-semibold text-foreground tracking-tight">
                      Hades B2B Scout
                    </h3>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    thesavorium@gmail.com · Savo Eats
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label="Tutup Chat"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 border-b border-border/40 bg-muted/10 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
              <Sparkles className="size-3 text-muted-foreground shrink-0" />
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(s)}
                  className="text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground border border-border/60 px-2 py-0.5 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col space-y-1 max-w-[88%]",
                    m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 leading-relaxed whitespace-pre-wrap",
                      m.sender === "user"
                        ? "bg-foreground text-background font-medium"
                        : "border-l-2 border-foreground bg-muted/20 text-foreground pl-3 pr-2 py-2"
                    )}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono px-0.5">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2 border-l-2 border-muted pl-3">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Hades sedang berpikir...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-border/60 flex items-center gap-2 bg-surface/30"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya ide kafe, hitung margin, atau draf email..."
                className="flex-1 bg-transparent border-b border-border/60 focus:border-foreground focus:outline-hidden py-1.5 px-1 text-xs text-foreground placeholder:text-muted-foreground font-sans transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                aria-label="Kirim Pesan"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
