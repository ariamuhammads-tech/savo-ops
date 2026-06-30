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
    const { error } = await supabase
      .from("business_settings")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "error", at: new Date().toISOString() },
        { status: 200 },
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "ok",
      at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "unreachable", at: new Date().toISOString() },
      { status: 200 },
    );
  }
}
