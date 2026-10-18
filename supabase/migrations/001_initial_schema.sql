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
) language sql stable security definer set search_path = public as $$
  with normalized as (
    select regexp_replace(public.fold_search_text(search_query), '[^[:alnum:]]+', '', 'g') compact,
           websearch_to_tsquery('simple', public.fold_search_text(search_query)) query
  ), ranked as (
    select o.id offer_id, p.id product_id, p.name product_name, p.brand, p.model, p.specifications,
      p.image_url, m.business_name merchant_name, m.city, o.price, o.currency, o.condition,
      o.availability, m.whatsapp, m.website,
      greatest(ts_rank(p.search_document, n.query), similarity(p.search_text, n.compact)) relevance
    from merchant_offers o join canonical_products p on p.id = o.product_id
    join merchants m on m.id = o.merchant_id cross join normalized n
    where m.status = 'approved' and m.whatsapp is not null and o.is_active
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
  limit least(page_size, 50) offset (greatest(page_number, 1) - 1) * least(page_size, 50);
$$;

alter table public.merchants enable row level security;
alter table public.canonical_products enable row level security;
alter table public.merchant_offers enable row level security;
create policy "Public can read canonical products" on public.canonical_products for select using (true);
create policy "Owners read their merchant" on public.merchants for select using (auth.uid() = user_id);
create policy "Google users create their merchant" on public.merchants for insert to authenticated with check (auth.uid() = user_id and email = lower(auth.jwt() ->> 'email'));
create policy "Owners update their merchant" on public.merchants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners manage offers" on public.merchant_offers for all using (merchant_id in (select id from public.merchants where user_id = auth.uid())) with check (merchant_id in (select id from public.merchants where user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-verification', 'business-verification', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

grant execute on function public.search_public_offers to anon, authenticated;
