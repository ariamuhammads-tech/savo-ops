// One-off demo seed: example costs/prices + a worked recipe for Sosis Original,
// so the HPP feature shows real numbers. Idempotent-ish (skips if recipe exists).
// Usage: node --env-file=.env.local scripts/seed-recipe-demo.mjs

import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

// name -> example last_unit_cost (Rp per unit)
const costs = {
  "Daging sapi giling (Australia)": 120, // per g (~Rp120.000/kg)
  "Casing sosis": 500, // per pcs
  Keju: 150, // per g
  "Bumbu campuran": 80, // per g
  "Kemasan pack": 2000, // per pcs
};

async function main() {
  await client.connect();

  for (const [name, cost] of Object.entries(costs)) {
    await client.query(
      "update public.ingredients set last_unit_cost = $1 where name = $2 and last_unit_cost = 0",
      [cost, name],
    );
  }

  // Example prices for Sosis Original
  await client.query(
    "update public.products set price_b2c = 45000, price_b2b = 38000 where name = 'Sosis Original' and price_b2c = 0",
  );

  const { rows: prod } = await client.query(
    "select id from public.products where name = 'Sosis Original' limit 1",
  );
  if (prod.length === 0) {
    console.log("Sosis Original not found; skip recipe.");
    await client.end();
    return;
  }
  const productId = prod[0].id;

  const { rows: existing } = await client.query(
    "select id from public.recipes where product_id = $1 limit 1",
    [productId],
  );
  if (existing.length > 0) {
    console.log("Recipe already exists for Sosis Original; skip.");
    await client.end();
    return;
  }

  const { rows: rec } = await client.query(
    `insert into public.recipes (product_id, name, yield_qty, yield_unit, overhead_cost, notes)
     values ($1, 'Resep Standar (contoh)', 10, 'pack', 20000, 'Contoh — silakan sesuaikan') returning id`,
    [productId],
  );
  const recipeId = rec[0].id;

  const items = [
    ["Daging sapi giling (Australia)", 2000, "g"],
    ["Bumbu campuran", 200, "g"],
    ["Casing sosis", 10, "pcs"],
    ["Kemasan pack", 10, "pcs"],
  ];
  for (const [name, qty, unit] of items) {
    const { rows: ing } = await client.query(
      "select id from public.ingredients where name = $1 limit 1",
      [name],
    );
    if (ing.length) {
      await client.query(
        "insert into public.recipe_items (recipe_id, ingredient_id, quantity, unit) values ($1,$2,$3,$4)",
        [recipeId, ing[0].id, qty, unit],
      );
    }
  }

  console.log("Seeded example recipe for Sosis Original with", items.length, "items.");
  await client.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
