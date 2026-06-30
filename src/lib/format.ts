import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Jakarta";

/** Format a number as IDR, e.g. 1234567 -> "Rp 1.234.567" (no cents in UI). */
export function formatIDR(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format a plain number with dot thousands separators, e.g. 1234567 -> "1.234.567". */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/** Format a date in WIB, e.g. "30 Jun 2026". Accepts Date | ISO string. */
export function formatDate(value: Date | string | number, pattern = "dd MMM yyyy"): string {
  return formatInTimeZone(value, TZ, pattern);
}

/** Parse Indonesian-formatted number input ("1.234.567,50") into a number. */
export function parseIndonesianNumber(input: string): number {
  if (!input) return 0;
  const normalized = input.trim().replace(/\./g, "").replace(/,/g, ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
