-- Merchant self-service hardening and search improvements. Additive; no records are removed.

-- 1. Owners may only touch their own profile fields. Status, ownership, email and
--    the verification document path are written exclusively by trusted server code
--    using the service role (the admin dashboard's Server Actions do exactly that).
revoke insert, update on public.merchants from authenticated;
grant insert (user_id, business_name, category, email) on public.merchants to authenticated;
grant update (business_name, representative_name, phone, whatsapp, city, address, website, registration_number, updated_at)
  on public.merchants to authenticated;

-- Only plain web links may be stored as a shop website. NOT VALID keeps existing rows untouched.
alter table public.merchants
  add constraint merchants_website_http check (website is null or website ~* '^https?://') not valid;

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

      if new.registration_number is distinct from old.registration_number
        and old.status <> 'pending'::public.merchant_status then
        raise exception 'The registration number is locked after review'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- One listing per product, condition and SKU, treating "no SKU" as a single value. The original
-- constraint let duplicate SKU-less listings through because NULLs never compare equal.
create unique index if not exists merchant_offers_identity_unique
  on public.merchant_offers (merchant_id, product_id, condition, merchant_sku) nulls not distinct;

-- 2. Search: a query made only of punctuation no longer matches every offer.
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
      greatest(ts_rank(p.search_document, n.query), extensions.similarity(p.search_text, n.compact)) relevance
    from public.merchant_offers o join public.canonical_products p on p.id = o.product_id
    join public.merchants m on m.id = o.merchant_id cross join normalized n
    where m.status = 'approved'::public.merchant_status and m.whatsapp is not null and o.is_active
      and n.compact <> ''
      and (p.search_document @@ n.query or p.search_text operator(extensions.%) n.compact or p.search_text like '%' || n.compact || '%')
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

-- 3. Filter options for the whole result set, not just the visible page.
create or replace function public.search_public_offer_facets(search_query text)
returns table (cities text[], brands text[], conditions text[], availabilities text[])
language sql stable security definer set search_path = '' as $$
  with normalized as (
    select regexp_replace(public.fold_search_text(search_query), '[^[:alnum:]]+', '', 'g') compact,
           websearch_to_tsquery('simple', public.fold_search_text(search_query)) query
  ), matched as (
    select m.city, p.brand, o.condition::text condition, o.availability::text availability
    from public.merchant_offers o join public.canonical_products p on p.id = o.product_id
    join public.merchants m on m.id = o.merchant_id cross join normalized n
    where m.status = 'approved'::public.merchant_status and m.whatsapp is not null and o.is_active
      and n.compact <> ''
      and (p.search_document @@ n.query or p.search_text operator(extensions.%) n.compact or p.search_text like '%' || n.compact || '%')
  ) select
    coalesce(array_agg(distinct city order by city) filter (where city is not null), '{}'),
    coalesce(array_agg(distinct brand order by brand), '{}'),
    coalesce(array_agg(distinct condition order by condition), '{}'),
    coalesce(array_agg(distinct availability order by availability), '{}')
  from matched;
$$;

revoke all on function public.search_public_offer_facets(text) from public, anon, authenticated;
grant execute on function public.search_public_offer_facets(text) to anon, authenticated;
