import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sheetConfigured } from "@/lib/gsheet";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Lightweight health check. Also touches the database so the Supabase
 * free-tier project does not pause after 7 days of inactivity.
 * Hit by the keep-alive GitHub Action every few days.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const tableNames = [
      "business_settings",
      "products",
      "ingredients",
      "stock_movements",
      "recipes",
      "recipe_items",
      "customers",
      "orders",
      "order_items",
      "payments",
      "invoices",
      "purchases",
      "purchase_items",
      "production_batches",
    ] as const;

    const results = await Promise.all(
      tableNames.map(async (t) => {
        const { error } = await supabase.from(t).select("id").limit(1);
        return [
          t,
          error ? `error:${error.code || error.message || error.name || "?"}` : "ok",
        ] as const;
      }),
    );
    const tables: Record<string, string> = Object.fromEntries(results);

    // Raw diagnostic probe (bypasses supabase-js) to see the real HTTP status.
    let probe = "n/a";
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
      const pr = await fetch(`${url}/rest/v1/business_settings?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const body = (await pr.text()).slice(0, 120);
      probe = `HTTP ${pr.status} keylen=${key.length} urlset=${!!url} body=${body}`;
    } catch (e) {
      probe = "fetch-threw:" + (e as Error).message;
    }

    const dbOk = tables.business_settings === "ok";
    return NextResponse.json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
      commit: process.env.COMMIT_REF?.slice(0, 7) ?? null,
      sheet_sync: sheetConfigured() ? "configured" : "off",
      probe,
      tables,
      at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "unreachable", at: new Date().toISOString() },
      { status: 200 },
    );
  }
}
