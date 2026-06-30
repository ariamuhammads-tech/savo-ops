"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wheat,
  BookOpenCheck,
  Users,
  ClipboardList,
  Wallet,
  ReceiptText,
  BarChart3,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/", label: "Dasbor", icon: LayoutDashboard },
  { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/bahan", label: "Bahan Baku", icon: Wheat },
  { href: "/resep", label: "Resep & HPP", icon: BookOpenCheck },
  { href: "/pelanggan", label: "Pelanggan", icon: Users },
  { href: "/pembayaran", label: "Pembayaran", icon: Wallet },
  { href: "/invoice", label: "Invoice", icon: ReceiptText },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

// Most-used items shown in the mobile bottom bar.
const BOTTOM: NavItem[] = NAV.filter((n) =>
  ["/", "/pesanan", "/produk", "/bahan"].includes(n.href),
);

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="size-5 shrink-0" />
        Keluar
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
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* ===== Desktop sidebar ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="font-serif text-2xl font-bold text-primary">SAVO</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Ops
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          {userEmail && (
            <p className="truncate px-3 pb-1 text-xs text-muted-foreground">
              {userEmail}
            </p>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* ===== Mobile top header ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold text-primary">SAVO</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Ops
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu"
          className="rounded-lg p-2 text-foreground hover:bg-secondary"
        >
          <MenuIcon className="size-6" />
        </button>
      </header>

      {/* ===== Mobile full menu overlay ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-serif text-lg font-bold text-primary">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              {userEmail && (
                <p className="truncate px-3 pb-1 text-xs text-muted-foreground">
                  {userEmail}
                </p>
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* ===== Main content ===== */}
      <div className="md:pl-64">
        <main className="mx-auto max-w-5xl px-4 py-5 pb-24 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {BOTTOM.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
        >
          <MenuIcon className="size-5" />
          Menu
        </button>
      </nav>
    </div>
  );
}
