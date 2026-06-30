-- =============================================================
-- SAVO Ops — Migration 0002
-- New Supabase projects (after 2026-05-30) require explicit grants
-- for the Data API (PostgREST). Grant the service_role role and
-- reload the PostgREST schema cache so tables become visible over REST.
-- =============================================================

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- Tell PostgREST to reload its schema cache immediately.
notify pgrst, 'reload schema';
