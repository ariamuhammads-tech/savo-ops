import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SavoLogo } from "@/components/savo-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Masuk · SAVO Ops",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 bg-background text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6 savo-in">
        <div className="flex flex-col items-center text-center">
          <SavoLogo className="h-9 w-auto text-foreground" />
          <p className="mt-2.5 text-xs text-muted-foreground">
            Savo Eats · Operasional &amp; Akuisisi B2B
          </p>
        </div>

        <div className="border-t border-b border-border/40 py-6 space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-medium tracking-tight text-foreground">Masuk ke Sistem</h2>
            <p className="text-xs text-muted-foreground">
              Akses khusus staf internal Savo Eats.
            </p>
          </div>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Hanya untuk staf SAVO. Hubungi pemilik jika butuh akses.
        </p>
      </div>
    </main>
  );
}
