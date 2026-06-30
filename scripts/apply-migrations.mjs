// Apply SQL migrations in supabase/migrations to the Supabase Postgres DB.
// Runs files in filename order inside a transaction each.
//
// Usage (PowerShell, from project root):
//   node --env-file=.env.local scripts/apply-migrations.mjs
//
// Requires SUPABASE_DB_URL in .env.local — the connection string from
// Supabase → Project Settings → Database → Connection string (URI).
// (Use the "Session"/pooler URI; it already contains your DB password.)

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    "ERROR: SUPABASE_DB_URL tidak ditemukan di .env.local.\n" +
      "Salin Connection string (URI) dari Supabase → Project Settings → Database.",
  );
  process.exit(1);
}

async function main() {
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("Tidak ada file migrasi.");
    return;
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("Terhubung ke database.\n");

  try {
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      process.stdout.write(`→ Menjalankan ${file} … `);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("commit");
        console.log("OK");
      } catch (err) {
        await client.query("rollback");
        console.log("GAGAL");
        throw err;
      }
    }
    console.log("\n✅ Semua migrasi berhasil diterapkan.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
