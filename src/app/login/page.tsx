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
          <SavoLogo className="h-10 w-auto text-primary" />
          <p className="mt-3 text-xs font-mono tracking-widest text-muted-foreground uppercase">
            Pusat Komando B2B // Hades
          </p>
        </div>

        <div className="border border-border rounded-lg bg-background p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Selamat Datang</h2>
            <p className="text-xs text-muted-foreground">
              Masuk untuk mengelola operasional dan akuisisi B2B SAVO.
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
