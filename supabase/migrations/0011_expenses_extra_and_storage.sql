-- =============================================================
-- SAVO Ops — Migration 0011
-- Expense reimbursement fields + receipt photo, and a public
-- Storage bucket for receipt photos.
-- =============================================================

alter table public.expenses add column if not exists is_reimbursement boolean not null default false;
alter table public.expenses add column if not exists reimburse_to      text;
alter table public.expenses add column if not exists reimburse_status  text not null default 'pending'
  check (reimburse_status in ('pending', 'paid'));
alter table public.expenses add column if not exists photo_url         text;

-- ---------------- Storage bucket for receipts ----------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do update set public = true;

-- Public read; authenticated users can upload/manage receipts.
drop policy if exists "receipts_public_read" on storage.objects;
create policy "receipts_public_read"
  on storage.objects for select
  using (bucket_id = 'receipts');

drop policy if exists "receipts_auth_insert" on storage.objects;
create policy "receipts_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts');

drop policy if exists "receipts_auth_update" on storage.objects;
create policy "receipts_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'receipts') with check (bucket_id = 'receipts');

drop policy if exists "receipts_auth_delete" on storage.objects;
create policy "receipts_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'receipts');

notify pgrst, 'reload schema';
