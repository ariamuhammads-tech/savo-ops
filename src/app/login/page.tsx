import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SavoLogo } from "@/components/savo-logo";
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
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 savo-in">
        <div className="flex flex-col items-center text-center">
          <SavoLogo className="h-10 w-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Dasbor Operasional</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Masuk</CardTitle>
            <CardDescription>
              Masukkan email dan kata sandi Anda untuk melanjutkan.
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
