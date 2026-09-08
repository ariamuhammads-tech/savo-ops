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
import { SavoLogo, SavoMark } from "@/components/savo-logo";
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
        "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150",
        active
          ? "bg-foreground text-background font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground active:scale-[0.99]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-4 shrink-0 transition-transform duration-150 group-hover:scale-105", active ? "text-background" : "text-muted-foreground group-hover:text-foreground")} />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span
          className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
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
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Aura Top Minimalist Meta Bar (Sticky Desktop & Tablet) */}
      <header className="top-meta-bar">
        {/* Brand & Technical Meta */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
            <SavoMark className="h-5 w-auto text-primary" />
            <div className="flex items-baseline gap-2 font-mono text-[11px] font-semibold text-foreground tracking-wider">
              <span>SAVO OPS</span>
              <span className="text-muted-foreground font-normal hidden sm:inline">// HADES B2B BUREAU</span>
              <span className="text-muted-foreground/60 hidden lg:inline">•</span>
              <span className="text-muted-foreground font-normal text-[10px] hidden lg:inline">thesavorium@gmail.com</span>
            </div>
          </Link>
        </div>

        {/* Center: Aura Flat Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAVIGATION.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-link-item",
                  active && "active text-foreground font-semibold"
                )}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge-count">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Status Indicator & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLINE</span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <ThemeToggle />

          <div className="hidden sm:block">
            <SignOutButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Buka menu"
            className="md:hidden rounded-md border border-border p-1.5 text-foreground hover:bg-secondary cursor-pointer"
          >
            <MenuIcon className="size-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-xs"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col bg-background shadow-2xl p-5 border-l border-border animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <SavoMark className="h-5 w-auto text-primary" />
                <span className="font-mono text-xs font-bold tracking-wider">SAVO OPS</span>
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
              {NAVIGATION.map((item) => {
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
                        ? "bg-foreground text-background font-semibold"
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

      {/* Expansive Canvas Arena (No Sidebar Offsets) */}
      <main className="flex-1 w-full pb-20 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (Apple HIG 5-Tab Bar with Safe Area) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden">
        {NAVIGATION.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 min-h-[50px] text-[10px] font-medium transition-colors active:scale-95",
                active ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4 mb-0.5 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate max-w-[62px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
