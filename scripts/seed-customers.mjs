import pg from "pg";
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const { rows } = await c.query("select count(*)::int n from public.customers");
if (rows[0].n === 0) {
  await c.query(
    "insert into public.customers (name, type, business_name, phone_wa, price_tier, payment_terms_days, notes) values \
     ($1,$2,$3,$4,$5,$6,$7), ($8,$9,$10,$11,$12,$13,$14)",
    [
      "Budi Santoso", "b2c", null, "6281234567890", "b2c", 0, "Contoh — pelanggan perorangan",
      "Kafe Kopi Senja", "b2b", "Kafe Kopi Senja", "6285700000000", "b2b", 14, "Contoh — pelanggan B2B, termin 14 hari",
    ],
  );
  console.log("Inserted 2 example customers.");
} else {
  console.log("customers not empty (" + rows[0].n + "); skip.");
}
await c.end();
