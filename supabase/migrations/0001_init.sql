-- Alankar Fashions — core schema
create extension if not exists pgcrypto with schema extensions;

-- ============ ADMIN ROLES ============
create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (email = lower(email)),
  name text,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admin_users
  where email = lower(coalesce(auth.jwt()->>'email','')) and active
  limit 1
$$;

create or replace function public.is_admin(min_role text default 'staff') returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case role when 'owner' then 3 when 'manager' then 2 else 1 end
       from public.admin_users
      where email = lower(coalesce(auth.jwt()->>'email','')) and active limit 1)
    >= case min_role when 'owner' then 3 when 'manager' then 2 else 1 end, false)
$$;

-- ============ CATALOG ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  name text not null,
  name_mr text,
  description text,
  image_url text,
  seo_title text,
  seo_description text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.categories(parent_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_mr text,
  category_id uuid references public.categories(id) on delete set null,
  short_description text,
  description text,
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  sku text,
  stock int not null default 10,
  track_stock boolean not null default true,
  images jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  badge text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  material text,
  finish text,
  care text,
  seo_title text,
  seo_description text,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products(category_id);
create index on public.products(active, is_featured);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ CONTENT & SETTINGS ============
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.pages (
  slug text primary key,
  title text not null,
  body text not null default '',
  seo_description text,
  updated_at timestamptz not null default now()
);

create table public.coupons (
  code text primary key check (code = upper(code)),
  kind text not null check (kind in ('percent','flat')),
  value int not null check (value > 0),
  min_order int not null default 0,
  max_uses int,
  used int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ CUSTOMERS & ORDERS ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  address jsonb,
  marketing boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence public.order_no_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null default ('ALK' || nextval('public.order_no_seq')),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text not null,
  name text not null,
  address jsonb not null,
  items jsonb not null,
  subtotal int not null,
  discount int not null default 0,
  shipping int not null default 0,
  cod_fee int not null default 0,
  total int not null,
  coupon_code text,
  payment_method text not null check (payment_method in ('cod','razorpay')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','cod')),
  status text not null default 'pending' check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  razorpay_order_id text,
  razorpay_payment_id text,
  courier text,
  tracking_number text,
  tracking_url text,
  notes text,
  admin_notes text,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(user_id);
create index on public.orders(created_at desc);
create index on public.orders(razorpay_order_id);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_events (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  actor text,
  created_at timestamptz not null default now()
);
create index on public.order_events(order_id);

create table public.newsletter (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null check (length(message) <= 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ PRIVATE (never exposed through the API) ============
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table private.secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table private.otp_codes (
  id bigserial primary key,
  email text not null,
  purpose text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create index on private.otp_codes(email, created_at desc);

-- owner-only: save a payment secret from the admin panel
create or replace function public.set_secret(p_key text, p_value text) returns void
language plpgsql security definer set search_path = public, private as $$
begin
  if not public.is_admin('owner') then raise exception 'Only the store owner can change payment keys'; end if;
  if p_key not in ('razorpay_key_id','razorpay_key_secret','razorpay_webhook_secret') then raise exception 'Unknown key'; end if;
  if p_value is null or length(trim(p_value)) = 0 then
    delete from private.secrets where key = p_key;
  else
    insert into private.secrets(key, value) values (p_key, trim(p_value))
    on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
end $$;

-- admin UI: which secrets are set (never returns values, except the public key id)
create or replace function public.secret_status() returns jsonb
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not public.is_admin('manager') then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'razorpay_key_id', (select value from private.secrets where key='razorpay_key_id'),
    'razorpay_key_secret', exists(select 1 from private.secrets where key='razorpay_key_secret'),
    'razorpay_webhook_secret', exists(select 1 from private.secrets where key='razorpay_webhook_secret'));
end $$;

-- service role only (edge function)
create or replace function public.service_get_secret(p_key text) returns text
language plpgsql stable security definer set search_path = public, private as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Not allowed'; end if;
  return (select value from private.secrets where key = p_key);
end $$;

create or replace function public.service_otp(p_action text, p_email text, p_purpose text, p_hash text default null) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare r private.otp_codes; recent int;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Not allowed'; end if;
  if p_action = 'create' then
    select count(*) into recent from private.otp_codes where email = p_email and created_at > now() - interval '15 minutes';
    if recent >= 5 then return jsonb_build_object('ok', false, 'error', 'Too many codes requested. Try again in 15 minutes.'); end if;
    if exists(select 1 from private.otp_codes where email = p_email and created_at > now() - interval '30 seconds') then
      return jsonb_build_object('ok', false, 'error', 'Please wait 30 seconds before requesting another code.');
    end if;
    update private.otp_codes set used = true where email = p_email and not used;
    insert into private.otp_codes(email, purpose, code_hash, expires_at) values (p_email, p_purpose, p_hash, now() + interval '5 minutes');
    return jsonb_build_object('ok', true);
  elsif p_action = 'verify' then
    select * into r from private.otp_codes where email = p_email and purpose = p_purpose and not used order by created_at desc limit 1;
    if r.id is null or r.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'Code expired. Request a new one.'); end if;
    if r.attempts >= 5 then return jsonb_build_object('ok', false, 'error', 'Too many wrong attempts. Request a new code.'); end if;
    if r.code_hash <> p_hash then
      update private.otp_codes set attempts = attempts + 1 where id = r.id;
      return jsonb_build_object('ok', false, 'error', 'That code is not correct.');
    end if;
    update private.otp_codes set used = true where id = r.id;
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('ok', false);
end $$;

-- public order tracking (limited fields, needs order no + phone or email)
create or replace function public.track_order(p_order_no text, p_contact text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('order_no', o.order_no, 'status', o.status, 'payment_status', o.payment_status,
    'payment_method', o.payment_method, 'total', o.total, 'created_at', o.created_at, 'courier', o.courier,
    'tracking_number', o.tracking_number, 'tracking_url', o.tracking_url,
    'items', (select jsonb_agg(jsonb_build_object('name', i->>'name', 'qty', i->'qty', 'image', i->>'image')) from jsonb_array_elements(o.items) i),
    'events', (select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.created_at) order by e.created_at) from public.order_events e where e.order_id = o.id))
  from public.orders o
  where upper(o.order_no) = upper(trim(p_order_no))
    and (lower(o.email) = lower(trim(p_contact)) or right(regexp_replace(o.phone,'\D','','g'),10) = right(regexp_replace(p_contact,'\D','','g'),10))
  limit 1
$$;

-- dashboard numbers
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin('staff') then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'today_revenue', coalesce((select sum(total) from orders where (created_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date and status <> 'cancelled' and payment_status in ('paid','cod')),0),
    'month_revenue', coalesce((select sum(total) from orders where created_at >= now() - interval '30 days' and status <> 'cancelled' and payment_status in ('paid','cod')),0),
    'month_orders', (select count(*) from orders where created_at >= now() - interval '30 days' and status <> 'cancelled' and payment_status in ('paid','cod')),
    'to_ship', (select count(*) from orders where status in ('confirmed','packed')),
    'unpaid', (select count(*) from orders where payment_status = 'pending' and status = 'pending'),
    'customers', (select count(distinct lower(email)) from orders),
    'low_stock', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'stock',stock) order by stock),'[]') from (select id,name,stock from products where active and track_stock and stock <= 3 order by stock limit 8) s),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'revenue', coalesce(r,0)) order by d),'[]') from (
        select d, (select sum(total) from orders o where (o.created_at at time zone 'Asia/Kolkata')::date = d::date and status <> 'cancelled' and payment_status in ('paid','cod')) r
        from generate_series((now() at time zone 'Asia/Kolkata')::date - 13, (now() at time zone 'Asia/Kolkata')::date, interval '1 day') d) x),
    'top', (select coalesce(jsonb_agg(t),'[]') from (select i->>'name' as name, sum((i->>'qty')::int) as qty from orders o, jsonb_array_elements(o.items) i where o.created_at >= now() - interval '30 days' and o.status <> 'cancelled' and o.payment_status in ('paid','cod') group by 1 order by 2 desc limit 5) t)
  );
end $$;

-- new auth users get a profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id) values (new.id) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.settings enable row level security;
alter table public.pages enable row level security;
alter table public.coupons enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.newsletter enable row level security;
alter table public.contact_messages enable row level security;

create policy "admins read team" on public.admin_users for select using (public.is_admin('staff'));
create policy "owner manages team" on public.admin_users for all using (public.is_admin('owner')) with check (public.is_admin('owner'));

create policy "public reads active categories" on public.categories for select using (active or public.is_admin('staff'));
create policy "managers edit categories" on public.categories for all using (public.is_admin('manager')) with check (public.is_admin('manager'));

create policy "public reads active products" on public.products for select using (active or public.is_admin('staff'));
create policy "managers edit products" on public.products for all using (public.is_admin('manager')) with check (public.is_admin('manager'));
create policy "staff update stock" on public.products for update using (public.is_admin('staff')) with check (public.is_admin('staff'));

create policy "public reads approved reviews" on public.reviews for select using (approved or public.is_admin('staff'));
create policy "anyone submits review" on public.reviews for insert with check (approved = false and length(coalesce(body,'')) <= 2000);
create policy "managers moderate reviews" on public.reviews for update using (public.is_admin('manager'));
create policy "managers delete reviews" on public.reviews for delete using (public.is_admin('manager'));

create policy "public reads settings" on public.settings for select using (true);
create policy "managers edit settings" on public.settings for all using (public.is_admin('manager')) with check (public.is_admin('manager'));

create policy "public reads pages" on public.pages for select using (true);
create policy "managers edit pages" on public.pages for all using (public.is_admin('manager')) with check (public.is_admin('manager'));

create policy "managers manage coupons" on public.coupons for all using (public.is_admin('manager')) with check (public.is_admin('manager'));

create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin('staff'));
create policy "own profile write" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "own orders read" on public.orders for select using (user_id = auth.uid() or public.is_admin('staff'));
create policy "staff update orders" on public.orders for update using (public.is_admin('staff')) with check (public.is_admin('staff'));

create policy "order events read" on public.order_events for select using (public.is_admin('staff') or exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "staff add events" on public.order_events for insert with check (public.is_admin('staff'));

create policy "anyone subscribes" on public.newsletter for insert with check (true);
create policy "admins read subscribers" on public.newsletter for select using (public.is_admin('staff'));
create policy "managers remove subscribers" on public.newsletter for delete using (public.is_admin('manager'));

create policy "anyone sends message" on public.contact_messages for insert with check (handled = false);
create policy "admins read messages" on public.contact_messages for select using (public.is_admin('staff'));
create policy "admins update messages" on public.contact_messages for update using (public.is_admin('staff'));

-- function grants
revoke execute on function public.service_get_secret(text) from public, anon, authenticated;
revoke execute on function public.service_otp(text,text,text,text) from public, anon, authenticated;
grant execute on function public.service_get_secret(text) to service_role;
grant execute on function public.service_otp(text,text,text,text) to service_role;
revoke execute on function public.set_secret(text,text) from public, anon;
revoke execute on function public.secret_status() from public, anon;
revoke execute on function public.admin_stats() from public, anon;

-- ============ STORAGE ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images', true, 8388608, array['image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "managers upload images" on storage.objects for insert to authenticated with check (bucket_id in ('product-images','site-assets') and public.is_admin('manager'));
create policy "managers update images" on storage.objects for update to authenticated using (bucket_id in ('product-images','site-assets') and public.is_admin('manager'));
create policy "managers delete images" on storage.objects for delete to authenticated using (bucket_id in ('product-images','site-assets') and public.is_admin('manager'));

revoke execute on function public.handle_new_user() from public, anon, authenticated;
