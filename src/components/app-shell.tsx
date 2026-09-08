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
  { href: "/", label: "01 HQ", icon: LayoutDashboard },
  { href: "/outbox", label: "02 OUTBOX", icon: Mail },
  { href: "/leads", label: "03 PROSPEK", icon: Building2 },
  { href: "/katalog", label: "04 KATALOG", icon: Package },
  { href: "/invoice", label: "05 INVOICE", icon: ReceiptText },
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
        "group flex items-center justify-between px-3 py-2.5 text-xs font-mono tracking-wider uppercase transition-colors",
        active
          ? "text-foreground font-bold border-l-2 border-foreground bg-muted/20"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-3.5 shrink-0", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span className="text-[10px] font-mono text-muted-foreground">
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
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 hover:text-destructive transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <LogOut className="size-3" />
        <span>KELUAR</span>
      </button>
    </form>
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
      {/* Aura Top Architectural Meta Bar */}
      <header className="top-meta-bar">
        {/* Brand & Technical Meta */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <SavoMark className="h-4.5 w-auto text-foreground" />
            <span className="font-extrabold text-xs tracking-tight text-foreground font-sans">SAVO</span>
            <span className="font-mono text-[9.5px] tracking-[0.2em] text-muted-foreground uppercase">
              // HADES
            </span>
          </Link>
        </div>

        {/* Center: Clean Architectural Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAVIGATION.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors inline-flex items-center gap-1.5 py-1",
                  active
                    ? "text-foreground font-bold"
                    : "text-muted-foreground/60 hover:text-foreground font-medium"
                )}
              >
                {active && <span className="size-1 rounded-full bg-foreground inline-block" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Status Indicator & Quick Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>ONLINE</span>
          </div>

          <div className="h-3 w-px bg-border hidden sm:block" />

          <ThemeToggle />

          <div className="h-3 w-px bg-border hidden sm:block" />

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
