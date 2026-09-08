import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SavoLogo } from "@/components/savo-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

        <Card className="border border-border shadow-card bg-card">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="font-display text-xl font-bold tracking-tight">Selamat Datang</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Masuk untuk mengelola operasional dan akuisisi B2B SAVO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Hanya untuk staf SAVO. Hubungi pemilik jika butuh akses.
        </p>
      </div>
    </main>
  );
}
