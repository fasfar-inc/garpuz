-- Additive administration and analytics support. No existing records are removed.

create unique index if not exists canonical_products_identity_unique
on public.canonical_products (
  lower(name),
  lower(brand),
  coalesce(lower(model), '')
);

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (length(action) between 3 and 100),
  entity_type text not null check (length(entity_type) between 3 and 80),
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.search_events (
  id bigint generated always as identity primary key,
  query text not null check (length(query) between 1 and 120),
  result_count integer not null check (result_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_contact_clicks (
  id bigint generated always as identity primary key,
  offer_id uuid references public.merchant_offers(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  product_id uuid references public.canonical_products(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
create index if not exists search_events_created_at_idx on public.search_events(created_at desc);
create index if not exists search_events_query_idx on public.search_events(lower(query));
create index if not exists whatsapp_contact_clicks_created_at_idx on public.whatsapp_contact_clicks(created_at desc);

alter table public.admin_audit_logs enable row level security;
alter table public.search_events enable row level security;
alter table public.whatsapp_contact_clicks enable row level security;

-- These operational tables are intentionally server-only. The service role used
-- by verified server handlers bypasses RLS; browser roles receive no privileges.
revoke all on public.admin_audit_logs from anon, authenticated;
revoke all on public.search_events from anon, authenticated;
revoke all on public.whatsapp_contact_clicks from anon, authenticated;
revoke all on sequence public.admin_audit_logs_id_seq from anon, authenticated;
revoke all on sequence public.search_events_id_seq from anon, authenticated;
revoke all on sequence public.whatsapp_contact_clicks_id_seq from anon, authenticated;

grant all on public.admin_audit_logs to service_role;
grant all on public.search_events to service_role;
grant all on public.whatsapp_contact_clicks to service_role;
grant all on sequence public.admin_audit_logs_id_seq to service_role;
grant all on sequence public.search_events_id_seq to service_role;
grant all on sequence public.whatsapp_contact_clicks_id_seq to service_role;
