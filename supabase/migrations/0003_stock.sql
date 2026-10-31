-- service-only helpers used by the checkout API
create or replace function public.service_commit_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare i jsonb; o public.orders;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Not allowed'; end if;
  select * into o from public.orders where id = p_order for update;
  for i in select * from jsonb_array_elements(o.items) loop
    update public.products set stock = greatest(stock - (i->>'qty')::int, 0)
     where id = (i->>'id')::uuid and track_stock;
  end loop;
  if o.coupon_code is not null then update public.coupons set used = used + 1 where code = o.coupon_code; end if;
end $$;
revoke execute on function public.service_commit_order(uuid) from public, anon, authenticated;
grant execute on function public.service_commit_order(uuid) to service_role;
