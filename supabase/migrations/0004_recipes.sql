-- =============================================================
-- SAVO Ops — Migration 0004 (Phase 1: Resep & HPP)
-- recipes + recipe_items + triggers, RLS, grants.
-- =============================================================

create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  name          text not null default 'Resep Standar',
  yield_qty     numeric(14,3) not null default 1,
  yield_unit    text,
  overhead_cost numeric(14,2) not null default 0,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_recipes_product on public.recipes (product_id);

drop trigger if exists trg_recipes_updated_at on public.recipes;
create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table if not exists public.recipe_items (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity      numeric(14,3) not null default 0,
  unit          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_recipe_items_recipe on public.recipe_items (recipe_id);

drop trigger if exists trg_recipe_items_updated_at on public.recipe_items;
create trigger trg_recipe_items_updated_at
  before update on public.recipe_items
  for each row execute function public.set_updated_at();

-- RLS
alter table public.recipes      enable row level security;
alter table public.recipe_items enable row level security;

drop policy if exists "recipes_all_authenticated" on public.recipes;
create policy "recipes_all_authenticated"
  on public.recipes for all to authenticated using (true) with check (true);

drop policy if exists "recipe_items_all_authenticated" on public.recipe_items;
create policy "recipe_items_all_authenticated"
  on public.recipe_items for all to authenticated using (true) with check (true);

-- Grants + reload
grant select, insert, update, delete on public.recipes, public.recipe_items
  to authenticated, service_role;

comment on table public.recipes      is 'SAVO Ops - resep standar';
comment on table public.recipe_items is 'SAVO Ops - item resep';

notify pgrst, 'reload schema';
