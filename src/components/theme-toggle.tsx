"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const KEY = "savo-theme";

/**
 * Saklar terang/gelap. Kelas `dark` di <html> dipasang lebih awal oleh skrip
 * di root layout; komponen ini hanya membalik & menyimpannya ke localStorage.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // null sampai mount → hindari salah ikon saat SSR (server tidak tahu tema).
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* localStorage bisa nonaktif — tema tetap berganti untuk sesi ini */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      className={cn(
        "flex size-9 items-center justify-center rounded-xl border border-border bg-secondary/60 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        className,
      )}
    >
      {dark === null ? (
        <Moon className="size-4 opacity-0" />
      ) : dark ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
