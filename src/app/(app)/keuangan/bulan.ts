// Month helpers for the Keuangan drill-down pages ("yyyy-MM" strings, WIB).
import { formatDate } from "@/lib/format";

export function currentMonth(): string {
  return formatDate(new Date(), "yyyy-MM");
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m - 1) + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(ym: string): string {
  return formatDate(ym + "-01", "MMMM yyyy");
}

/** True when the ISO date/timestamp falls inside the "yyyy-MM" month. */
export function inMonth(dateStr: string | null | undefined, ym: string): boolean {
  return String(dateStr ?? "").slice(0, 7) === ym;
}
