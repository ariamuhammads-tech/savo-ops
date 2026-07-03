import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SavoLogo } from "@/components/savo-logo";
import { StoveFlames } from "@/components/stove-flames";
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
    <main className="flex min-h-dvh items-center justify-center p-4">
      <StoveFlames />
      <div className="w-full max-w-sm space-y-7 savo-in">
        <div className="flex flex-col items-center text-center">
          <span className="relative">
            <SavoLogo className="h-11 w-auto" />
            <span className="absolute -right-2 -top-1 size-2 rounded-full bg-[color:var(--ember)] shadow-[0_0_10px_3px_rgba(245,158,11,0.6)]" />
          </span>
          <p className="mt-3 text-sm font-medium tracking-wide text-muted-foreground">
            Dasbor Operasional
          </p>
        </div>

        <Card className="shadow-[var(--shadow-pop)]">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="font-serif text-2xl">Selamat datang</CardTitle>
            <CardDescription>
              Masuk untuk mengelola operasional SAVO.
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
