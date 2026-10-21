-- Merchant self-service: shops manage their own profile and listings.
-- Additive only. Run after 001 and 002. No existing records are removed.

-- 1. Administrator moderation is separate from a shop pausing its own listing.
--    Previously an admin "disable" set is_active=false, which the shop owner
--    could immediately flip back on. admin_hidden can only be changed by an admin.
alter table public.merchant_offers
  add column if not exists admin_hidden boolean not null default false;

create or replace function private.protect_offer_moderation_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_garpuz_admin() then
    if tg_op = 'INSERT' and new.admin_hidden then
      raise exception 'Only an administrator may hide an offer'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' then
      if new.admin_hidden is distinct from old.admin_hidden then
        raise exception 'Only an administrator may change offer moderation'
          using errcode = '42501';
      end if;
      if new.merchant_id is distinct from old.merchant_id then
        raise exception 'Offers cannot be moved to another merchant'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.protect_offer_moderation_fields() from public, anon, authenticated;

drop trigger if exists protect_offer_moderation_fields on public.merchant_offers;
create trigger protect_offer_moderation_fields
before insert or update on public.merchant_offers
for each row execute function private.protect_offer_moderation_fields();

-- 2. Shops can add products that are not yet in the catalog. Track who added
--    them so administrators can review and clean up the canonical catalog.
alter table public.canonical_products
  add column if not exists created_by_merchant_id uuid references public.merchants(id) on delete set null;

-- 3. Shops may edit their profile, but not the sign-in email that ties the
--    shop to their Google account, nor the verification document path (which
--    is written only by the server after a validated upload).
create or replace function private.protect_merchant_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_garpuz_admin() then
    if tg_op = 'INSERT' then
      if new.status <> 'pending'::public.merchant_status then
        raise exception 'New merchants must await administrator approval'
          using errcode = '42501';
      end if;
      if new.verification_document_path is not null then
        raise exception 'Verification documents must be uploaded through Garpuz'
          using errcode = '42501';
      end if;
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
      if new.email is distinct from old.email then
        raise exception 'The shop email is tied to the Google account and cannot be changed'
          using errcode = '42501';
      end if;
      if new.verification_document_path is distinct from old.verification_document_path then
        raise exception 'Verification documents must be uploaded through Garpuz'
          using errcode = '42501';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_merchant_authorization_fields() from public, anon, authenticated;

-- 4. Keep updated_at honest without relying on every caller to set it.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;

drop trigger if exists touch_merchants_updated_at on public.merchants;
create trigger touch_merchants_updated_at
before update on public.merchants
for each row execute function private.touch_updated_at();

drop trigger if exists touch_merchant_offers_updated_at on public.merchant_offers;
create trigger touch_merchant_offers_updated_at
before update on public.merchant_offers
for each row execute function private.touch_updated_at();

create index if not exists merchant_offers_merchant_idx on public.merchant_offers(merchant_id, updated_at desc);

-- 5. Public search additionally excludes offers hidden by an administrator.
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
    where m.status = 'approved'::public.merchant_status and m.whatsapp is not null
      and o.is_active and not o.admin_hidden
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

revoke all on function public.search_public_offers(text, text, text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_public_offers(text, text, text, text, text, text, integer, integer) to anon, authenticated;

-- 6. Shops add or update listings in one call, for both the "Add product" form
--    and spreadsheet imports. Each item either references an existing catalog
--    product (product_id) or describes one (name/brand/model/category), which
--    is matched case-insensitively or created. Runs as definer so shops can
--    create catalog entries, so it verifies ownership itself and never lets a
--    caller touch another shop's listings.
--    p_mode: 'insert' reports an existing identical listing as a duplicate;
--            'upsert' updates it instead (used by catalog import).
create or replace function public.merchant_save_offers(p_items jsonb, p_mode text default 'upsert')
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_merchant uuid;
  v_item jsonb;
  v_results jsonb := '[]'::jsonb;
  v_product uuid;
  v_offer uuid;
  v_name text; v_brand text; v_model text; v_category text; v_image text; v_sku text;
  v_condition public.offer_condition;
  v_availability public.stock_status;
  v_active boolean;
  v_row int;
begin
  select m.id into v_merchant from public.merchants m where m.user_id = (select auth.uid());
  if v_merchant is null then
    raise exception 'No shop is linked to this account' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return v_results;
  end if;
  if jsonb_array_length(p_items) > 500 then
    raise exception 'At most 500 items can be saved at once' using errcode = '22023';
  end if;
  if p_mode not in ('insert', 'upsert') then
    raise exception 'Unknown save mode' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_row := coalesce((v_item ->> 'row')::int, 0);
    begin
      v_product := null; v_offer := null;
      v_sku := nullif(btrim(coalesce(v_item ->> 'sku', '')), '');
      v_condition := coalesce(nullif(v_item ->> 'condition', ''), 'new')::public.offer_condition;
      v_availability := coalesce(nullif(v_item ->> 'availability', ''), 'in_stock')::public.stock_status;
      v_active := coalesce((v_item ->> 'is_active')::boolean, true);

      if nullif(v_item ->> 'product_id', '') is not null then
        select p.id into v_product from public.canonical_products p where p.id = (v_item ->> 'product_id')::uuid;
        if v_product is null then
          raise exception 'Catalog product not found';
        end if;
      else
        v_name := nullif(btrim(coalesce(v_item ->> 'name', '')), '');
        v_brand := nullif(btrim(coalesce(v_item ->> 'brand', '')), '');
        v_model := nullif(btrim(coalesce(v_item ->> 'model', '')), '');
        v_category := nullif(btrim(coalesce(v_item ->> 'category', '')), '');
        v_image := nullif(btrim(coalesce(v_item ->> 'image_url', '')), '');
        if v_name is null or v_brand is null or v_category is null then
          raise exception 'Name, brand and category are required';
        end if;
        if length(v_name) > 160 or length(v_brand) > 100 or length(coalesce(v_model, '')) > 120 or length(v_category) > 100 then
          raise exception 'Product details are too long';
        end if;
        if v_image is not null and (v_image !~* '^https?://' or length(v_image) > 500) then
          raise exception 'Image URL must start with http:// or https://';
        end if;

        select p.id into v_product from public.canonical_products p
        where lower(p.name) = lower(v_name) and lower(p.brand) = lower(v_brand)
          and coalesce(lower(p.model), '') = coalesce(lower(v_model), '')
        limit 1;

        if v_product is null then
          begin
            insert into public.canonical_products (name, brand, model, category, image_url, created_by_merchant_id)
            values (v_name, v_brand, v_model, v_category, v_image, v_merchant)
            returning id into v_product;
          exception when unique_violation then
            select p.id into v_product from public.canonical_products p
            where lower(p.name) = lower(v_name) and lower(p.brand) = lower(v_brand)
              and coalesce(lower(p.model), '') = coalesce(lower(v_model), '')
            limit 1;
          end;
        end if;
      end if;

      select o.id into v_offer from public.merchant_offers o
      where o.merchant_id = v_merchant and o.product_id = v_product
        and o.condition = v_condition and o.merchant_sku is not distinct from v_sku
      limit 1;

      if v_offer is not null and p_mode = 'insert' then
        v_results := v_results || jsonb_build_object('row', v_row, 'status', 'failed', 'error', 'duplicate', 'offer_id', v_offer);
      elsif v_offer is not null then
        update public.merchant_offers set
          price = (v_item ->> 'price')::numeric,
          currency = upper(coalesce(nullif(v_item ->> 'currency', ''), currency)),
          availability = v_availability,
          is_active = coalesce((v_item ->> 'is_active')::boolean, is_active)
        where id = v_offer;
        v_results := v_results || jsonb_build_object('row', v_row, 'status', 'updated', 'offer_id', v_offer);
      else
        insert into public.merchant_offers (merchant_id, product_id, merchant_sku, price, currency, condition, availability, is_active)
        values (v_merchant, v_product, v_sku, (v_item ->> 'price')::numeric,
                upper(coalesce(nullif(v_item ->> 'currency', ''), 'TRY')), v_condition, v_availability, v_active)
        returning id into v_offer;
        v_results := v_results || jsonb_build_object('row', v_row, 'status', 'created', 'offer_id', v_offer);
      end if;
    exception when others then
      v_results := v_results || jsonb_build_object('row', v_row, 'status', 'failed', 'error', sqlerrm);
    end;
  end loop;

  return v_results;
end;
$$;

revoke all on function public.merchant_save_offers(jsonb, text) from public, anon;
grant execute on function public.merchant_save_offers(jsonb, text) to authenticated;
