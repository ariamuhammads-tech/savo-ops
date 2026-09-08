"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  Building2,
  Package,
  ReceiptText,
  MessageSquare,
  FileSpreadsheet,
  LogOut,
  Menu as MenuIcon,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SavoLogo } from "@/components/savo-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const PIPELINE_NAVIGATION: NavItem[] = [
  { href: "/", label: "1. Target Kafe", icon: Building2 },
  { href: "/outbox", label: "2. Draf Penawaran", icon: Mail },
  { href: "/follow-up", label: "3. Follow-Up", icon: MessageSquare },
  { href: "/invoice", label: "4. Deal & Invoice", icon: ReceiptText },
];

const UTILITY_NAVIGATION: NavItem[] = [
  { href: "/invoice/baru", label: "Invoice Generator", icon: FileSpreadsheet },
  { href: "/katalog", label: "Katalog", icon: Package },
];

const MOBILE_NAVIGATION = [
  { href: "/", label: "Target", icon: Building2 },
  { href: "/outbox", label: "Penawaran", icon: Mail },
  { href: "/follow-up", label: "Follow-Up", icon: MessageSquare },
  { href: "/invoice/baru", label: "Invoice", icon: FileSpreadsheet },
  { href: "/katalog", label: "Katalog", icon: Package },
];

const ALL_NAVIGATION = [...PIPELINE_NAVIGATION, ...UTILITY_NAVIGATION];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <button
        type="submit"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <LogOut className="size-3" />
        <span>Keluar</span>
      </button>
    </form>
  );
}

export function AppShell({
  children,
  userEmail: _userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Top Architectural Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#d99204]/30 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 lg:px-8">
          {/* Brand: Master Original SAVO Vector Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <SavoLogo className="h-5 w-auto text-[#d99204]" />
            </Link>
          </div>

          {/* Center: Pipeline 4-Stage Sequential Navigation */}
          <nav className="hidden md:flex items-center h-full gap-5 lg:gap-7">
            {PIPELINE_NAVIGATION.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center h-full text-[13px] tracking-tight transition-colors",
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground font-normal"
                  )}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d99204]" />
                  )}
                </Link>
              );
            })}

            <div className="h-3.5 w-px bg-border/40 my-auto hidden lg:block" />

            {UTILITY_NAVIGATION.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center h-full text-[13px] tracking-tight transition-colors",
                    active
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground font-normal"
                  )}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d99204]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Status Indicator & Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Online</span>
            </div>

            <div className="h-3 w-px bg-border/60 hidden sm:block" />

            <ThemeToggle />

            <div className="h-3 w-px bg-border/60 hidden sm:block" />

            <div className="hidden sm:block">
              <SignOutButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              className="md:hidden p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <MenuIcon className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[#d99204]/20 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-background shadow-2xl p-5 border-l border-border animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center">
                <SavoLogo className="h-5 w-auto text-[#d99204]" />
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1.5 hover:bg-secondary cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              {ALL_NAVIGATION.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-md transition-colors",
                      active
                        ? "bg-[#d99204] text-background font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-4 border-t border-border space-y-3">
              <p className="font-mono text-[10px] text-muted-foreground">
                thesavorium@gmail.com
              </p>
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* Expansive Canvas Arena (Generous bottom clearance for mobile bar) */}
      <main className="flex-1 w-full pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (Generous Apple HIG 64px Height with Safe Area) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 h-16 border-t border-[#d99204]/25 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden">
        <div className="grid grid-cols-5 h-full">
          {MOBILE_NAVIGATION.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full transition-colors active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute top-0 inset-x-3 h-[2px] bg-[#d99204] rounded-full" />
                )}
                <Icon className={cn("size-5 transition-colors", active ? "text-[#d99204]" : "text-muted-foreground/70")} />
                <span className={cn(
                  "text-[11px] mt-1 tracking-tight truncate max-w-[64px]",
                  active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
