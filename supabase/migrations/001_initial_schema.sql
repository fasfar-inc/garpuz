create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type public.merchant_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.offer_condition as enum ('new', 'used', 'refurbished');
create type public.stock_status as enum ('in_stock', 'out_of_stock', 'preorder');

create or replace function public.fold_search_text(input text)
returns text language sql immutable strict parallel safe as $$
  select translate(lower(input), 'çğıöşüâîû', 'cgiosuaiu');
$$;

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  business_name text not null,
  representative_name text,
  email text not null unique,
  phone text,
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  category text not null,
  city text,
  address text,
  website text,
  registration_number text unique,
  verification_document_path text,
  logo_url text,
  status public.merchant_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.canonical_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  model text,
  specifications jsonb not null default '{}'::jsonb,
  category text not null,
  image_url text,
  search_document tsvector generated always as (to_tsvector('simple', public.fold_search_text(coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' || coalesce(specifications::text,'')))) stored,
  search_text text generated always as (regexp_replace(public.fold_search_text(coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' || coalesce(specifications::text,'')), '[^[:alnum:]]+', '', 'g')) stored,
  created_at timestamptz not null default now()
);

create table public.merchant_offers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  product_id uuid not null references public.canonical_products(id) on delete restrict,
  merchant_sku text,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'TRY',
  condition public.offer_condition not null default 'new',
  availability public.stock_status not null default 'in_stock',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id, product_id, condition, merchant_sku)
);

-- Authorization is derived only from Auth app_metadata, which end users cannot
-- update themselves. The service role remains available for trusted backend jobs.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_garpuz_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function private.is_garpuz_admin() from public, anon;
grant execute on function private.is_garpuz_admin() to authenticated, service_role;

create or replace function private.protect_merchant_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_garpuz_admin() then
    if tg_op = 'INSERT' and new.status <> 'pending'::public.merchant_status then
      raise exception 'New merchants must await administrator approval'
        using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        raise exception 'Only an administrator may change merchant approval status'
          using errcode = '42501';
      end if;

      if new.user_id is distinct from old.user_id then
        raise exception 'Merchant ownership cannot be transferred'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_merchant_authorization_fields() from public, anon, authenticated;

create trigger protect_merchant_authorization_fields
before insert or update on public.merchants
for each row execute function private.protect_merchant_authorization_fields();

create index canonical_products_search_document_idx on public.canonical_products using gin(search_document);
create index canonical_products_search_text_trgm_idx on public.canonical_products using gin(search_text gin_trgm_ops);
create index merchant_offers_product_idx on public.merchant_offers(product_id) where is_active;
create index merchants_public_idx on public.merchants(status, city);

create or replace function public.search_public_offers(
  search_query text, sort_mode text default 'relevance', city_filter text default null,
  condition_filter text default null, brand_filter text default null, availability_filter text default null,
  page_number int default 1, page_size int default 12
) returns table (
  offer_id uuid, product_id uuid, product_name text, brand text, model text,
  specifications jsonb, image_url text, merchant_name text, city text, price numeric,
  currency char(3), condition public.offer_condition, availability public.stock_status,
  whatsapp text, website text, total_count bigint
) language sql stable security definer set search_path = '' as $$
  with normalized as (
    select regexp_replace(public.fold_search_text(search_query), '[^[:alnum:]]+', '', 'g') compact,
           websearch_to_tsquery('simple', public.fold_search_text(search_query)) query
  ), ranked as (
    select o.id offer_id, p.id product_id, p.name product_name, p.brand, p.model, p.specifications,
      p.image_url, m.business_name merchant_name, m.city, o.price, o.currency, o.condition,
      o.availability, m.whatsapp, m.website,
      greatest(ts_rank(p.search_document, n.query), public.similarity(p.search_text, n.compact)) relevance
    from public.merchant_offers o join public.canonical_products p on p.id = o.product_id
    join public.merchants m on m.id = o.merchant_id cross join normalized n
    where m.status = 'approved'::public.merchant_status and m.whatsapp is not null and o.is_active
      and (p.search_document @@ n.query or p.search_text % n.compact or p.search_text like '%' || n.compact || '%')
      and (city_filter is null or m.city = city_filter)
      and (condition_filter is null or o.condition::text = condition_filter)
      and (brand_filter is null or p.brand = brand_filter)
      and (availability_filter is null or o.availability::text = availability_filter)
  ) select r.offer_id, r.product_id, r.product_name, r.brand, r.model, r.specifications,
    r.image_url, r.merchant_name, r.city, r.price, r.currency, r.condition, r.availability,
    r.whatsapp, r.website, count(*) over() total_count
  from ranked r order by
    case when sort_mode = 'price_asc' then r.price end asc,
    case when sort_mode = 'price_desc' then r.price end desc,
    case when sort_mode = 'relevance' then r.relevance end desc, r.product_name
  limit greatest(1, least(coalesce(page_size, 12), 50))
  offset (greatest(coalesce(page_number, 1), 1) - 1) * greatest(1, least(coalesce(page_size, 12), 50));
$$;

alter table public.merchants enable row level security;
alter table public.canonical_products enable row level security;
alter table public.merchant_offers enable row level security;

revoke all on public.merchants from anon, authenticated;
revoke all on public.canonical_products from anon, authenticated;
revoke all on public.merchant_offers from anon, authenticated;
grant select, insert, update on public.merchants to authenticated;
grant select on public.canonical_products to anon, authenticated;
grant select, insert, update, delete on public.merchant_offers to authenticated;

create policy "Public can read canonical products"
on public.canonical_products for select to anon, authenticated
using (true);

create policy "Owners read their merchant"
on public.merchants for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Administrators read merchants"
on public.merchants for select to authenticated
using ((select private.is_garpuz_admin()));

create policy "Google users create pending merchant"
on public.merchants for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and email = lower((select auth.jwt()) ->> 'email')
  and status = 'pending'::public.merchant_status
);

create policy "Owners update merchant profile"
on public.merchants for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Administrators approve merchants"
on public.merchants for update to authenticated
using ((select private.is_garpuz_admin()))
with check ((select private.is_garpuz_admin()));

create policy "Owners read their offers"
on public.merchant_offers for select to authenticated
using (exists (
  select 1 from public.merchants m
  where m.id = merchant_id and m.user_id = (select auth.uid())
));

create policy "Owners create their offers"
on public.merchant_offers for insert to authenticated
with check (exists (
  select 1 from public.merchants m
  where m.id = merchant_id and m.user_id = (select auth.uid())
));

create policy "Owners update their offers"
on public.merchant_offers for update to authenticated
using (exists (
  select 1 from public.merchants m
  where m.id = merchant_id and m.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.merchants m
  where m.id = merchant_id and m.user_id = (select auth.uid())
));

create policy "Owners delete their offers"
on public.merchant_offers for delete to authenticated
using (exists (
  select 1 from public.merchants m
  where m.id = merchant_id and m.user_id = (select auth.uid())
));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-verification', 'business-verification', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

revoke all on function public.search_public_offers(text, text, text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_public_offers(text, text, text, text, text, text, integer, integer) to anon, authenticated;
