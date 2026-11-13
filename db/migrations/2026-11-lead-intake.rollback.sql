-- ROLLBACK for 2026-11-lead-intake.sql. Drops only the new table (and its indexes/constraints). Does not touch public.solar_leads.
-- Data loss note: any rows in lead_intake are deleted. Export first if the table has been used.
begin;
drop table if exists public.lead_intake;
commit;
