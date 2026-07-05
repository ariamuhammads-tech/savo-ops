-- 0013: Mode Demo (latihan) — a parallel "demo" schema mirroring public.
--
-- The app switches the PostgREST schema per session (cookie "savo-demo"), so
-- every feature runs with its real logic against sandbox tables. reset_demo()
-- wipes all demo data and re-copies master data (produk/bahan/resep/pelanggan/
-- pengaturan) from public — called on BOTH demo start and demo end, so a demo
-- session never leaves permanent data behind.

create schema if not exists demo;

-- ---------------------------------------------------------------
-- Tables: structural clones of public (defaults, PKs, indexes).
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'business_settings','products','ingredients','stock_movements',
    'recipes','recipe_items','customers','orders','order_items',
    'payments','invoices','purchases','purchase_items',
    'production_batches','expenses'
  ] loop
    execute format(
      'create table if not exists demo.%I (like public.%I including all)', t, t);
    -- updated_at trigger (LIKE does not copy triggers)
    execute format('drop trigger if exists trg_demo_updated_at on demo.%I', t);
    execute format(
      'create trigger trg_demo_updated_at before update on demo.%I
         for each row execute function public.set_updated_at()', t);
    -- RLS: same rule as public — any authenticated staff member, full access.
    execute format('alter table demo.%I enable row level security', t);
    execute format('drop policy if exists demo_all_authenticated on demo.%I', t);
    execute format(
      'create policy demo_all_authenticated on demo.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Parent-child cascades the app's delete flows rely on.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'demo_recipe_items_recipe_fk') then
    alter table demo.recipe_items add constraint demo_recipe_items_recipe_fk
      foreign key (recipe_id) references demo.recipes(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'demo_order_items_order_fk') then
    alter table demo.order_items add constraint demo_order_items_order_fk
      foreign key (order_id) references demo.orders(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'demo_payments_order_fk') then
    alter table demo.payments add constraint demo_payments_order_fk
      foreign key (order_id) references demo.orders(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'demo_invoices_order_fk') then
    alter table demo.invoices add constraint demo_invoices_order_fk
      foreign key (order_id) references demo.orders(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'demo_purchase_items_purchase_fk') then
    alter table demo.purchase_items add constraint demo_purchase_items_purchase_fk
      foreign key (purchase_id) references demo.purchases(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Numbering: demo gets its own counter namespace in public.seq_counters
-- ('demo-…'), so SO/INV/PB/PRD numbers in latihan never advance real ones.
-- ---------------------------------------------------------------
create or replace function demo.next_seq(p_name text)
returns integer
language sql
security definer
set search_path = public
as $$
  select public.next_seq('demo-' || p_name);
$$;

-- ---------------------------------------------------------------
-- Reset: wipe everything, re-seed master data from public.
-- ---------------------------------------------------------------
create or replace function demo.reset_demo()
returns void
language plpgsql
security definer
set search_path = demo, public
as $$
begin
  truncate
    demo.stock_movements, demo.payments, demo.invoices, demo.order_items,
    demo.orders, demo.purchase_items, demo.purchases, demo.production_batches,
    demo.expenses, demo.recipe_items, demo.recipes, demo.customers,
    demo.products, demo.ingredients, demo.business_settings
    cascade;

  insert into demo.business_settings select * from public.business_settings;
  insert into demo.products          select * from public.products;
  insert into demo.ingredients       select * from public.ingredients;
  insert into demo.recipes           select * from public.recipes;
  insert into demo.recipe_items      select * from public.recipe_items;
  insert into demo.customers         select * from public.customers;

  -- Fresh numbering every training session (SO-…-0001 again).
  delete from public.seq_counters where name like 'demo-%';
end;
$$;

-- ---------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------
grant usage on schema demo to authenticated, service_role;
grant select, insert, update, delete on all tables in schema demo
  to authenticated, service_role;
grant execute on function demo.next_seq(text) to authenticated, service_role;
grant execute on function demo.reset_demo() to authenticated, service_role;

-- ---------------------------------------------------------------
-- Expose the schema to the Data API (what the dashboard toggle does).
-- ---------------------------------------------------------------
do $$
declare cfg text;
begin
  select regexp_replace(c, '^pgrst\.db_schemas=', '') into cfg
  from (
    select unnest(setconfig) as c
    from pg_db_role_setting s
    join pg_roles r on r.oid = s.setrole
    where r.rolname = 'authenticator'
  ) t
  where c like 'pgrst.db_schemas=%';

  if cfg is null or cfg = '' then
    cfg := 'public, graphql_public, storage';
  end if;
  if position('demo' in cfg) = 0 then
    cfg := cfg || ', demo';
    execute format('alter role authenticator set pgrst.db_schemas = %L', cfg);
  end if;
end $$;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
