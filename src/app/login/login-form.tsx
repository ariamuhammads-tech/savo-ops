"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { login, loginDirect, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? "Memproses…" : "Masuk"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="thesavorium@gmail.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-card px-2 text-muted-foreground">Mode Cepat</span>
        </div>
      </div>

      <form action={loginDirect}>
        <Button
          type="submit"
          variant="outline"
          className="w-full text-xs font-mono font-medium border-border/70 hover:bg-secondary"
        >
          ⚡ Masuk Pusat Komando Hades
        </Button>
      </form>
    </div>
  );
}
