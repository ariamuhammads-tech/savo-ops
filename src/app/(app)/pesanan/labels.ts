import type { BadgeProps } from "@/components/ui/badge";

type BadgeVariant = BadgeProps["variant"];

export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "in_production",
  "ready",
  "delivered",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Review 2026-07-06: istilah mengikuti alur dokumen penjualan —
// Draf Penawaran → Sales Order → (produksi/kirim) → Selesai, atau Batal.
export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draf Penawaran",
  confirmed: "Sales Order",
  in_production: "Produksi",
  ready: "Siap",
  delivered: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  draft: "outline",
  confirmed: "primary",
  in_production: "warning",
  ready: "warning",
  delivered: "primary",
  completed: "success",
  cancelled: "destructive",
};

export const CHANNEL_LABEL: Record<string, string> = {
  wa: "WhatsApp",
  ig: "Instagram",
  b2b: "B2B",
  other: "Lainnya",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Belum bayar",
  partial: "Sebagian",
  paid: "Lunas",
};

export const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  unpaid: "destructive",
  partial: "warning",
  paid: "success",
};

export const METHOD_LABEL: Record<string, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
  other: "Lainnya",
};
