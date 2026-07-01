-- =============================================================
-- SAVO Ops — Migration 0010 (Phase 3: Keuangan / Financial)
-- expenses (operational costs) for a simple profit view.
-- =============================================================

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  expense_date date not null default (now() at time zone 'Asia/Jakarta')::date,
  category     text,
  description  text,
  amount       numeric(14,2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses (expense_date desc);

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "expenses_all_authenticated" on public.expenses;
create policy "expenses_all_authenticated"
  on public.expenses for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.expenses to authenticated, service_role;

comment on table public.expenses is 'SAVO Ops - pengeluaran operasional';

notify pgrst, 'reload schema';
