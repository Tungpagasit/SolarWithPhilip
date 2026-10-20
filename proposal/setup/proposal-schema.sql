create extension if not exists pgcrypto;
create table if not exists public.proposals (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 homeowner jsonb not null default '{}'::jsonb, concern_profile jsonb not null default '{}'::jsonb,
 current_energy jsonb not null default '{}'::jsonb, future_energy jsonb not null default '{}'::jsonb,
 property jsonb not null default '{}'::jsonb, planning jsonb not null default '{}'::jsonb,
 authorization jsonb not null default '{}'::jsonb, status text not null default 'draft'
);
alter table public.proposals enable row level security;
-- Server-side Netlify function uses the service-role key. Do not expose that key in browser code.
