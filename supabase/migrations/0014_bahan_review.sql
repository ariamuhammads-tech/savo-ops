-- 0014: Review fixes for Bahan Baku (owner app review 2026-07-06).
--
-- 1) shelf_life_days: "timer bahan baku" — masa segar bahan dalam hari.
--    Umur bahan dihitung dari pembelian terakhir; jika melewati masa segar,
--    muncul peringatan (dasbor & daftar bahan).
-- 2) Applied to BOTH public and demo schemas (demo tables were cloned with
--    LIKE at migration 0013 and do not pick up new columns automatically).
--    demo.reset_demo() uses `insert .. select *`, so column lists must match.

alter table public.ingredients
  add column if not exists shelf_life_days integer;

comment on column public.ingredients.shelf_life_days is
  'Masa segar bahan (hari) sejak pembelian terakhir. NULL = tidak dipantau.';

alter table demo.ingredients
  add column if not exists shelf_life_days integer;

notify pgrst, 'reload schema';
