"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Wheat,
  ShoppingBag,
  BookOpenCheck,
  Users,
  ClipboardList,
  ClipboardCheck,
  Wallet,
  ReceiptText,
  BarChart3,
  ChefHat,
  Factory,
  PiggyBank,
  Sparkles,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SavoLogo } from "@/components/savo-logo";
import { endDemoMode } from "@/app/(app)/pengaturan/demo-actions";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { title: string; items: NavItem[] };

// Grouped for an editorial, organised feel. Every original route is preserved.
const SECTIONS: NavSection[] = [
  {
    title: "Utama",
    items: [
      { href: "/", label: "Dasbor", icon: LayoutDashboard },
      { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
      { href: "/pembayaran", label: "Pembayaran", icon: Wallet },
      { href: "/invoice", label: "Invoice", icon: ReceiptText },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/produk", label: "Produk", icon: Package },
      { href: "/bahan", label: "Bahan Baku", icon: Wheat },
      { href: "/opname", label: "Stock Opname", icon: ClipboardCheck },
      { href: "/resep", label: "Resep & HPP", icon: BookOpenCheck },
    ],
  },
  {
    title: "Dapur",
    items: [
      { href: "/pembelian", label: "Pembelian", icon: ShoppingBag },
      { href: "/masak", label: "Masak", icon: ChefHat },
      { href: "/produksi", label: "Produksi", icon: Factory },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { href: "/asisten", label: "Asisten AI", icon: Sparkles },
      { href: "/pelanggan", label: "Pelanggan", icon: Users },
      { href: "/keuangan", label: "Keuangan", icon: PiggyBank },
      { href: "/laporan", label: "Laporan", icon: BarChart3 },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

const ALL: NavItem[] = SECTIONS.flatMap((s) => s.items);

// Most-used items shown in the mobile bottom bar.
const BOTTOM: NavItem[] = ["/", "/pesanan", "/produk", "/bahan"]
  .map((href) => ALL.find((n) => n.href === href)!)
  .filter(Boolean);

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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_rgba(192,73,43,0.65)]"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-secondary hover:text-foreground",
      )}
    >
      {/* active left indicator — a small ember bar */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[color:var(--ember)] transition-all duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-white/15 text-primary-foreground"
            : "bg-secondary/70 text-muted-foreground group-hover:bg-white group-hover:text-primary",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      {item.label}
    </Link>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
          <LogOut className="size-[18px]" />
        </span>
        Keluar
      </button>
    </form>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex items-center">
        <SavoLogo className="h-7 w-auto" />
        {/* tiny living ember beside the mark */}
        <span className="absolute -right-1.5 -top-0.5 size-1.5 rounded-full bg-[color:var(--ember)] shadow-[0_0_8px_2px_rgba(245,158,11,0.6)]" />
      </span>
      <span className="rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Ops
      </span>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4 last:mb-0">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function AppShell({
  children,
  userEmail,
  isDemo = false,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      {/* ===== Desktop sidebar ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-gradient-to-b from-white/80 to-white/55 backdrop-blur-xl md:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="savo-hairline mx-5 mb-2" />
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavList />
        </nav>
        <div className="border-t border-border p-3">
          {userEmail && (
            <div className="mb-1 flex items-center gap-2.5 rounded-xl bg-secondary/50 px-3 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
                {userEmail.slice(0, 1)}
              </span>
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            </div>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* ===== Mobile top header ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu"
          className="rounded-xl border border-border bg-secondary/60 p-2 text-foreground transition-colors hover:bg-secondary"
        >
          <MenuIcon className="size-5" />
        </button>
      </header>

      {/* ===== Mobile full menu overlay ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="animate-in fade-in absolute inset-0 bg-foreground/45 backdrop-blur-sm duration-200"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-in slide-in-from-right absolute right-0 top-0 flex h-full w-72 max-w-[86%] flex-col bg-card shadow-[var(--shadow-pop)] duration-300">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-xl p-2 transition-colors hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <NavList onNavigate={() => setMenuOpen(false)} />
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
      <div className="md:pl-72">
        <main className="mx-auto max-w-5xl px-4 py-5 pb-28 md:py-8 md:pb-10">
          {isDemo && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--warning)]/50 bg-[color:var(--warning)]/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-semibold text-[color:var(--warning)]">
                <FlaskConical className="size-4 shrink-0" />
                MODE DEMO — data latihan, akan dihapus saat demo diakhiri
              </span>
              <form
                action={endDemoMode}
                onSubmit={(e) => {
                  if (
                    !window.confirm(
                      "Akhiri mode demo? Semua data latihan akan dihapus permanen.",
                    )
                  )
                    e.preventDefault();
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-[color:var(--warning)]/50 px-2.5 py-1 text-xs font-semibold text-[color:var(--warning)] transition-colors hover:bg-[color:var(--warning)]/15"
                >
                  Akhiri Demo
                </button>
              </form>
            </div>
          )}
          <div key={pathname} className="savo-in">
            {children}
          </div>
        </main>
      </div>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/90 backdrop-blur-xl md:hidden">
        {BOTTOM.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-all duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-xl">
            <MenuIcon className="size-5" />
          </span>
          Menu
        </button>
      </nav>
    </div>
  );
}
