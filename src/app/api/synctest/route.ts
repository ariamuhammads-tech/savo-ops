import { NextResponse } from "next/server";
import { syncDiag, SYNC_TABS, type SyncType } from "@/app/(app)/laporan/sync-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Token-guarded diagnostics for the Google Sheets sync (temporary).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const type = url.searchParams.get("type") ?? "";

  if (type === "all") {
    const out: Record<string, unknown> = {};
    for (const t of SYNC_TABS) out[t] = await syncDiag(t as SyncType, token);
    return NextResponse.json(out);
  }
  return NextResponse.json(await syncDiag(type as SyncType, token));
}
