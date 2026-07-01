// One-off seed of example products & ingredients (Phase 1) via direct DB.
// Safe: only inserts when the tables are still empty.
// Usage: node --env-file=.env.local scripts/seed-phase1.mjs

import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const products = [
  ["SO-ORI", "Sosis Original", "Sosis", "pack", 250],
  ["SO-CHE", "Sosis Cheese", "Sosis", "pack", 250],
  ["SO-HAB", "Sosis Habanero", "Sosis", "pack", 250],
  ["BIT-ORI", "Bitterballen", "Bitterballen", "pack", 250],
];

const ingredients = [
  ["Daging sapi giling (Australia)", "g"],
  ["Casing sosis", "pcs"],
  ["Keju", "g"],
  ["Bumbu campuran", "g"],
  ["Kemasan pack", "pcs"],
];

async function main() {
  await client.connect();

  const { rows: pc } = await client.query("select count(*)::int n from public.products");
  if (pc[0].n === 0) {
    for (const [sku, name, cat, unit, weight] of products) {
      await client.query(
        `insert into public.products (sku, name, category, unit, weight_grams, price_b2c, price_b2b, stock_qty, min_stock, is_active, notes)
         values ($1,$2,$3,$4,$5,0,0,0,5,true,'Contoh — silakan sesuaikan harga & stok')`,
        [sku, name, cat, unit, weight],
      );
    }
    console.log(`Inserted ${products.length} example products.`);
  } else {
    console.log(`products not empty (${pc[0].n}); skip.`);
  }

  const { rows: ic } = await client.query("select count(*)::int n from public.ingredients");
  if (ic[0].n === 0) {
    for (const [name, unit] of ingredients) {
      await client.query(
        `insert into public.ingredients (name, unit, stock_qty, min_stock, last_unit_cost, notes)
         values ($1,$2,0,0,0,'Contoh — silakan sesuaikan')`,
        [name, unit],
      );
    }
    console.log(`Inserted ${ingredients.length} example ingredients.`);
  } else {
    console.log(`ingredients not empty (${ic[0].n}); skip.`);
  }

  await client.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
