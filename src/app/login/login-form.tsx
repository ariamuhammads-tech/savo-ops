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
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-foreground text-background py-2.5 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
    >
      {pending && <Loader2 className="animate-spin size-3.5" />}
      <span>{pending ? "Memproses…" : "Masuk"}</span>
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="thesavorium@gmail.com"
            required
            className="border-b border-border/60 rounded-none bg-transparent px-0 py-2 text-xs text-foreground focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">Kata sandi</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="border-b border-border/60 rounded-none bg-transparent px-0 py-2 text-xs text-foreground focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="border-l-2 border-destructive pl-3 py-1 text-xs text-destructive"
          >
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-background px-2 text-muted-foreground">Atau</span>
        </div>
      </div>

      <form action={loginDirect}>
        <button
          type="submit"
          className="w-full border border-border py-2 text-xs font-medium text-foreground hover:border-foreground transition-colors cursor-pointer"
        >
          Masuk Otomatis (Akses Cepat)
        </button>
      </form>
    </div>
  );
}
