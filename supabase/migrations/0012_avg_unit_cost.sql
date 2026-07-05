-- 0012: Weighted-average cost (biaya rata-rata tertimbang) for ingredients.
--
-- Why: when a new purchase is cheaper/more expensive than the stock already
-- on hand, HPP should reflect the BLENDED cost of what is actually in the
-- kitchen — not just the latest price. On every purchase the app recomputes:
--   avg = (stok_lama × avg_lama + qty_beli × harga_beli) / (stok_lama + qty_beli)
-- `last_unit_cost` stays as "harga beli terakhir" (informational + fallback).

alter table public.ingredients
  add column if not exists avg_unit_cost numeric(14,2) not null default 0;

comment on column public.ingredients.avg_unit_cost is
  'Biaya rata-rata tertimbang per satuan (dipakai untuk HPP). Diperbarui otomatis saat pembelian; diubah manual = override.';

-- Backfill: start every existing ingredient from its last purchase price.
update public.ingredients
set avg_unit_cost = last_unit_cost
where avg_unit_cost = 0 and last_unit_cost > 0;
