-- =============================================================
-- SAVO Ops — Migration 0008
-- Order-level contact (name + phone) for walk-in / quick orders,
-- so invoices always show a name & number even without a saved customer.
-- =============================================================

alter table public.orders add column if not exists contact_name  text;
alter table public.orders add column if not exists contact_phone text;

notify pgrst, 'reload schema';
