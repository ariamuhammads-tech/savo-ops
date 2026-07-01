-- =============================================================
-- SAVO Ops — Migration 0007 (Phase 1: Invoice)
-- invoices + trigger, RLS, grants.
-- =============================================================

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  invoice_no   text unique,
  order_id     uuid references public.orders (id) on delete set null,
  customer_id  uuid references public.customers (id) on delete set null,
  issue_date   date not null default (now() at time zone 'Asia/Jakarta')::date,
  due_date     date,
  status       text not null default 'sent'
                 check (status in ('draft','sent','paid','overdue','cancelled')),
  total        numeric(14,2) not null default 0,
  pdf_url      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_invoices_order on public.invoices (order_id);

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

drop policy if exists "invoices_all_authenticated" on public.invoices;
create policy "invoices_all_authenticated"
  on public.invoices for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.invoices to authenticated, service_role;

comment on table public.invoices is 'SAVO Ops - invoice';

notify pgrst, 'reload schema';
