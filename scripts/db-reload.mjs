// Connect directly to Postgres (SUPABASE_DB_URL), verify key tables exist,
// then force PostgREST to reload its schema cache (DDL touch + NOTIFY).
//
// Usage: node --env-file=.env.local scripts/db-reload.mjs

import pg from "pg";

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL missing in .env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to Postgres.\n");

  // List public tables
  const { rows: tables } = await client.query(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  );
  console.log("public tables:", tables.map((t) => t.tablename).join(", "));

  // Counts for key tables
  for (const t of ["business_settings", "profiles", "products", "ingredients", "stock_movements"]) {
    try {
      const { rows } = await client.query(`select count(*)::int as n from public.${t}`);
      console.log(`  ${t}: ${rows[0].n} rows`);
    } catch (e) {
      console.log(`  ${t}: MISSING (${e.message})`);
    }
  }

  // Force a DDL event on every public table so PostgREST's ddl_watch fires,
  // then also send the reload notification explicitly.
  console.log("\nForcing PostgREST schema reload…");
  for (const t of tables) {
    await client.query(
      `comment on table public.${t.tablename} is 'savo-ops'`,
    );
  }
  await client.query(`notify pgrst, 'reload schema'`);
  await client.query(`notify pgrst, 'reload config'`);
  console.log("Reload signalled.");

  await client.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
