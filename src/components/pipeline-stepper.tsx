"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  stats?: {
    targetCount?: number;
    stagedCount?: number;
    sentCount?: number;
    dealCount?: number;
  };
}

const STEPS = [
  {
    step: 1,
    href: "/",
    title: "1. Target Kafe",
    desc: "Tentukan sasaran",
    statKey: "targetCount" as const,
  },
  {
    step: 2,
    href: "/outbox",
    title: "2. Draf Penawaran",
    desc: "Tinjau & kirim",
    statKey: "stagedCount" as const,
  },
  {
    step: 3,
    href: "/follow-up",
    title: "3. Follow-Up",
    desc: "Respon & tester",
    statKey: "sentCount" as const,
  },
  {
    step: 4,
    href: "/invoice",
    title: "4. Deal & Invoice",
    desc: "Invoice pesanan",
    statKey: "dealCount" as const,
  },
];

export function PipelineStepper({ currentStep, stats }: PipelineStepperProps) {
  return (
    <nav aria-label="Alur Kerja Operasional" className="border-b border-[#d99204]/30 pb-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="text-[11px] text-muted-foreground">
          Alur Kerja B2B
        </span>
        <span className="text-[11.5px]">
          Langkah <strong className="text-foreground font-medium">{currentStep}</strong> dari 4
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STEPS.map((s) => {
          const isActive = s.step === currentStep;
          const isPast = s.step < currentStep;
          const statValue = stats ? stats[s.statKey] : undefined;

          return (
            <Link
              key={s.step}
              href={s.href}
              className={cn(
                "group relative py-2 transition-colors border-b",
                isActive
                  ? "border-[#d99204] text-foreground"
                  : isPast
                  ? "border-border/60 hover:border-foreground/60 text-muted-foreground hover:text-foreground"
                  : "border-transparent hover:border-border/40 text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn(
                  "text-xs font-medium tracking-tight",
                  isActive ? "text-foreground font-semibold" : ""
                )}>
                  {s.title}
                </span>
                {isPast ? (
                  <Check className="size-3 text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {statValue !== undefined ? statValue : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {s.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
