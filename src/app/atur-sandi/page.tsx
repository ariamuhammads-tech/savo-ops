import type { Metadata } from "next";
import { SetPasswordForm } from "./set-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Atur Kata Sandi · SAVO Ops",
};

export default function SetPasswordPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-primary">
            SAVO
          </h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Atur kata sandi</CardTitle>
            <CardDescription>
              Buat kata sandi untuk akun Anda agar bisa masuk berikutnya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
