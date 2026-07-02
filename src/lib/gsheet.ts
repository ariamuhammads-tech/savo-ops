// Client for the SAVO Google Apps Script Web App (server-only).
// Reads/writes a tab ("produk" | "bahan") as JSON rows.

const URL = () => process.env.GOOGLE_APPS_SCRIPT_URL ?? "";
const TOKEN = () => process.env.GOOGLE_SYNC_TOKEN ?? "";

export function sheetConfigured(): boolean {
  return !!URL() && !!TOKEN();
}

export type SheetRow = Record<string, string | number>;

export async function sheetGet(tab: string): Promise<SheetRow[]> {
  const u = `${URL()}?token=${encodeURIComponent(TOKEN())}&tab=${encodeURIComponent(tab)}`;
  const res = await fetch(u, { redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet GET gagal (HTTP ${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error("Sheet: " + data.error);
  return (data.rows ?? []) as SheetRow[];
}

export async function sheetReplace(
  tab: string,
  headers: string[],
  rows: SheetRow[],
): Promise<void> {
  const res = await fetch(URL(), {
    method: "POST",
    redirect: "follow",
    cache: "no-store",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: TOKEN(), tab, headers, rows }),
  });
  if (!res.ok) throw new Error(`Sheet POST gagal (HTTP ${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error("Sheet: " + data.error);
}
