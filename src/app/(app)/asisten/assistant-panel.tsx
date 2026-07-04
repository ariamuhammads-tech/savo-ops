"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  Check,
  Package,
  Wheat,
  Users,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeEntity, applyProposals, type Proposal } from "./actions";

const ENTITIES: { key: string; label: string; icon: LucideIcon; note?: string }[] = [
  { key: "produk", label: "Produk", icon: Package },
  { key: "bahan", label: "Bahan Baku", icon: Wheat },
  { key: "pelanggan", label: "Pelanggan", icon: Users, note: "Nomor WA & kontak tidak dikirim ke AI" },
];

type Phase = "idle" | "analyzing" | "review" | "applying";

export function AssistantPanel() {
  const [entity, setEntity] = useState("produk");
  const [phase, setPhase] = useState<Phase>("idle");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();

  const busy = phase === "analyzing" || phase === "applying";
  const entityDef = ENTITIES.find((e) => e.key === entity)!;

  function analyze() {
    setPhase("analyzing");
    setProposals([]);
    startTransition(async () => {
      const res = await analyzeEntity(entity);
      if (!res.ok) {
        toast.error(res.error);
        setPhase("idle");
        return;
      }
      setProposals(res.proposals);
      setRowCount(res.rowCount);
      setChecked(new Set(res.proposals.map((_, i) => i)));
      setPhase("review");
    });
  }

  function apply() {
    const picked = proposals.filter((_, i) => checked.has(i));
    if (picked.length === 0) {
      toast.error("Pilih dulu perubahan yang ingin diterapkan.");
      return;
    }
    if (
      !window.confirm(
        `Terapkan ${picked.length} perubahan ke data ${entityDef.label}?`,
      )
    )
      return;
    setPhase("applying");
    startTransition(async () => {
      const res = await applyProposals(
        entity,
        picked.map((p) => ({ id: p.id, field: p.field, proposed: p.proposed })),
      );
      if (!res.ok) {
        toast.error(res.error);
        setPhase("review");
        return;
      }
      toast.success(`${res.updated} baris ${entityDef.label} dirapikan. ✨`);
      setProposals([]);
      setPhase("idle");
    });
  }

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const allChecked = checked.size === proposals.length && proposals.length > 0;

  return (
    <div className="space-y-4">
      {/* Entity picker */}
      <div className="grid grid-cols-3 gap-2">
        {ENTITIES.map((e) => {
          const Icon = e.icon;
          const active = entity === e.key;
          return (
            <button
              key={e.key}
              type="button"
              disabled={busy}
              onClick={() => {
                setEntity(e.key);
                setPhase("idle");
                setProposals([]);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-all",
                active
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              <Icon className={cn("size-5", active ? "text-primary" : "")} />
              {e.label}
            </button>
          );
        })}
      </div>
      {entityDef.note && (
        <p className="text-xs text-muted-foreground">🔒 {entityDef.note}.</p>
      )}

      <Button onClick={analyze} disabled={busy} className="w-full">
        {phase === "analyzing" ? (
          <>
            <Loader2 className="animate-spin" />
            AI sedang membaca data…
          </>
        ) : (
          <>
            <Sparkles />
            Analisis {entityDef.label} dengan AI
          </>
        )}
      </Button>

      {/* Review list */}
      {phase === "review" && proposals.length === 0 && (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <PartyPopper className="size-8 text-[color:var(--success)]" />
          <p className="font-medium">Data {entityDef.label} sudah rapi!</p>
          <p className="text-sm text-muted-foreground">
            AI memeriksa {rowCount} baris dan tidak menemukan yang perlu diperbaiki.
          </p>
        </Card>
      )}

      {(phase === "review" || phase === "applying") && proposals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {proposals.length} usulan perbaikan
              <span className="text-muted-foreground"> · dari {rowCount} baris</span>
            </p>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() =>
                setChecked(
                  allChecked ? new Set() : new Set(proposals.map((_, i) => i)),
                )
              }
            >
              {allChecked ? "Batal semua" : "Pilih semua"}
            </button>
          </div>

          <div className="space-y-2">
            {proposals.map((p, i) => {
              const on = checked.has(i);
              return (
                <button
                  key={`${p.id}-${p.field}-${i}`}
                  type="button"
                  onClick={() => toggle(i)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    on ? "border-primary/50 bg-accent/50" : "border-border bg-card opacity-70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{p.rowLabel}</p>
                        <Badge variant="outline">{p.fieldLabel}</Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground line-through decoration-destructive/50">
                          {p.current || "(kosong)"}
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-[color:var(--success)]">
                          {p.proposed}
                        </span>
                      </p>
                      {p.reason && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.reason}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button onClick={apply} disabled={busy || checked.size === 0} className="w-full">
            {phase === "applying" ? (
              <>
                <Loader2 className="animate-spin" />
                Menerapkan…
              </>
            ) : (
              <>
                <Check />
                Terapkan {checked.size} perubahan
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
