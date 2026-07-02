import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sheetConfigured, sheetGet, sheetReplace } from "@/lib/gsheet";

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
      "expenses",
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

    // Server-side probe of the Google Sheets bridge (from Vercel's network).
    let sheet_probe: unknown = "off";
    if (sheetConfigured()) {
      try {
        const rows = await sheetGet("produk");
        let write = "n/a";
        try {
          await sheetReplace("_probe", ["a", "b"], [{ a: "1", b: new Date().toISOString() }]);
          write = "ok";
        } catch (e) {
          write = "err:" + String((e as Error).message).slice(0, 120);
        }
        sheet_probe = { ok: true, rows: rows.length, write };
      } catch (e) {
        sheet_probe = { ok: false, err: String((e as Error).message).slice(0, 160) };
      }
    }

    const dbOk = tables.business_settings === "ok";
    return NextResponse.json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
      commit: process.env.COMMIT_REF?.slice(0, 7) ?? null,
      sheet_sync: sheetConfigured() ? "configured" : "off",
      sheet_probe,
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
