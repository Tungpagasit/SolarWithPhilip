-- PROPOSED MIGRATION (Phase 2B). NOT EXECUTED. Requires explicit approval before running against Supabase.
-- Additive only: creates one new table plus one trigger function/trigger that belong to it. Does not read, alter, or write public.solar_leads (it only references solar_leads.id as an optional FK).
-- Access model: RLS enabled with NO policies. Only the service-role key (used by Netlify functions) can read/write; the anon key has no access.

begin;

create table public.lead_intake (
  id                      bigint generated always as identity primary key,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- Idempotency and enrichment authorization (not the primary key)
  submission_key          text not null,
  enrich_token            uuid not null default gen_random_uuid(),

  -- Identity
  first_name              text not null,
  last_name               text,
  email_normalized        text,
  phone_normalized        text,
  preferred_contact       text not null,

  -- Location / context
  zip                     text not null,
  utility                 text,
  bill_band               text,
  primary_goal            text,
  existing_quote          boolean not null default false,
  review_concern          text,
  property_address        text,

  -- Submission
  lead_type               text not null,
  form_source             text not null,
  source_page             text,
  conversion_page         text,
  landing_path            text,
  message                 text,

  -- Private uploads (storage object paths only; no public URLs)
  quote_upload_path       text,
  quote_upload_name       text,
  quote_upload_type       text,
  quote_upload_size       bigint,
  bill_upload_path        text,
  bill_upload_name        text,
  bill_upload_type        text,
  bill_upload_size        bigint,

  -- Attribution (whitelisted marketing parameters only; no PII)
  attribution_first       jsonb,
  attribution_current     jsonb,

  -- Consent / versioning (wording versions are DRAFT until owner/legal approval)
  consent_text_version    text not null,
  privacy_version         text not null,
  consent_at              timestamptz not null default now(),
  consent_contact_methods text,

  -- Operations (routing itself is not part of Phase 2B)
  status                  text not null default 'new',
  assigned_to             text,
  assigned_at             timestamptz,
  status_updated_at       timestamptz,
  outcome                 text,
  outcome_at              timestamptz,

  -- Optional deterministic link to the existing deeper-analysis record
  solar_lead_id           bigint references public.solar_leads(id) on delete set null,

  constraint lead_intake_contact_present check (email_normalized is not null or phone_normalized is not null),
  constraint lead_intake_preferred_contact check (preferred_contact in ('email','phone')),
  constraint lead_intake_lead_type check (lead_type in ('get_started','quote_compare')),
  constraint lead_intake_form_source check (form_source in ('homepage_primary','get_started_page','compare_my_quote')),
  constraint lead_intake_status check (status in ('new','contacted','qualified','proposal','won','lost','spam','duplicate')),
  constraint lead_intake_zip check (zip ~ '^[0-9]{5}$'),
  constraint lead_intake_message_len check (message is null or char_length(message) <= 500)
);

create unique index lead_intake_submission_key_uidx on public.lead_intake (submission_key);
create index lead_intake_created_at_idx on public.lead_intake (created_at desc);
create index lead_intake_email_idx on public.lead_intake (email_normalized) where email_normalized is not null;
create index lead_intake_phone_idx on public.lead_intake (phone_normalized) where phone_normalized is not null;
create index lead_intake_status_idx on public.lead_intake (status, created_at desc);
create index lead_intake_solar_lead_idx on public.lead_intake (solar_lead_id) where solar_lead_id is not null;

-- updated_at is maintained by the database, so no function has to remember to set it.
-- The trigger function is new and specific to this table; no existing function or trigger is touched.
create function public.lead_intake_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger lead_intake_set_updated_at
before update on public.lead_intake
for each row
execute function public.lead_intake_set_updated_at();

alter table public.lead_intake enable row level security;
-- Intentionally no policies: anon/authenticated roles are denied; service_role bypasses RLS.
-- Defense in depth: also remove table privileges from the public API roles.
revoke all on table public.lead_intake from anon, authenticated;
-- Required on this project: service_role does not receive automatic table privileges (observed 42501 on first production use).
grant select, insert, update on public.lead_intake to service_role;

commit;
