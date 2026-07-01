"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IMPORT_CONFIG, type ImportType } from "./import-config";

export type ImportResult = {
  ok: boolean;
  inserted: number;
  updated: number;
  error?: string;
};

export async function importData(
  type: ImportType,
  rows: Record<string, unknown>[],
): Promise<ImportResult> {
  const cfg = IMPORT_CONFIG[type];
  if (!cfg) return { ok: false, inserted: 0, updated: 0, error: "Tipe tidak dikenal." };

  const clean = rows.filter((r) => String(r.name ?? "").trim() !== "");
  if (clean.length === 0) return { ok: false, inserted: 0, updated: 0, error: "Tidak ada baris valid." };

  const supabase = await createClient();

  // Existing rows for matching
  const { data: existing } = await supabase
    .from(cfg.table)
    .select(cfg.matchBy === "sku" ? "id, sku, name" : "id, name");

  const bySku = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const e of existing ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = e as any;
    if (row.sku) bySku.set(String(row.sku), row.id);
    if (row.name) byName.set(String(row.name).toLowerCase(), row.id);
  }

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; row: Record<string, unknown> }[] = [];

  for (const r of clean) {
    const sku = r.sku ? String(r.sku) : "";
    const name = String(r.name).toLowerCase();
    let id: string | undefined;
    if (cfg.matchBy === "sku" && sku) id = bySku.get(sku);
    if (!id) id = byName.get(name);

    if (id) updates.push({ id, row: r });
    else inserts.push(r);
  }

  // Table name is dynamic, so bypass the generated per-table typing here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tbl = () => supabase.from(cfg.table) as any;

  try {
    if (inserts.length) {
      const { error } = await tbl().insert(inserts);
      if (error) throw error;
    }
    for (const u of updates) {
      const { error } = await tbl().update(u.row).eq("id", u.id);
      if (error) throw error;
    }
  } catch (e) {
    return {
      ok: false,
      inserted: 0,
      updated: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: "Gagal impor: " + ((e as any)?.message ?? "kesalahan tak dikenal"),
    };
  }

  revalidatePath(`/${type}`);
  return { ok: true, inserted: inserts.length, updated: updates.length };
}
