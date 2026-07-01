import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    ] as const;

    const tables: Record<string, string> = {};
    for (const t of tableNames) {
      const { error } = await supabase.from(t).select("id").limit(1);
      tables[t] = error ? `error:${error.code ?? error.message}` : "ok";
    }

    const dbOk = tables.business_settings === "ok";
    return NextResponse.json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
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
