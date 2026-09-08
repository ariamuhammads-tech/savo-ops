"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Building2,
  Package,
  ReceiptText,
  LogOut,
  Menu as MenuIcon,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SavoLogo } from "@/components/savo-logo";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

const NAVIGATION: NavItem[] = [
  { href: "/", label: "HQ Hades", icon: LayoutDashboard },
  { href: "/outbox", label: "Antrean Outbox", icon: Mail },
  { href: "/leads", label: "Prospek Bandung", icon: Building2 },
  { href: "/katalog", label: "Katalog & Margin", icon: Package },
  { href: "/invoice", label: "Generator Invoice", icon: ReceiptText },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background font-bold shadow-xs"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 shrink-0" />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.2 rounded",
            active ? "bg-background/20 text-background" : "bg-secondary text-muted-foreground"
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
      >
        <LogOut className="size-4" />
        <span>Keluar Sistem</span>
      </button>
    </form>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <SavoLogo className="h-6 w-auto text-primary" />
      <div className="border-l border-border pl-2.5">
        <span className="font-display text-xs font-bold tracking-wider text-foreground block">
          HADES // B2B
        </span>
        <span className="text-[9px] font-mono text-muted-foreground block -mt-0.5">
          thesavorium@gmail.com
        </span>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Desktop Sidebar (Swiss Editorial Monoline) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="p-5 border-b border-border">
          <Brand />
        </div>

        <div className="p-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground px-3 mb-2 block">
            Pusat Akuisisi B2B
          </span>
          <nav className="space-y-1">
            {NAVIGATION.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-border p-3 space-y-2">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/40 text-xs">
            <span className="truncate text-muted-foreground font-mono text-[11px]">
              {userEmail || "thesavorium@gmail.com"}
            </span>
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-xs md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="rounded-lg border border-border bg-secondary/50 p-2 text-foreground"
          >
            <MenuIcon className="size-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-64 flex-col bg-card shadow-pop p-4 border-l border-border">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1.5 hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              {NAVIGATION.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="mt-auto pt-4 border-t border-border space-y-2">
              <p className="font-mono text-[11px] text-muted-foreground px-2">
                thesavorium@gmail.com
              </p>
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Arena */}
      <div className="md:pl-64">
        <main className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-8 md:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Apple HIG 5-Tab Bar) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur-xs md:hidden">
        {NAVIGATION.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors",
                active ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4 mb-0.5", active ? "text-primary" : "")} />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
