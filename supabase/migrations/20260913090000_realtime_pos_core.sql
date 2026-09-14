create table if not exists public.pos_holds (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references public.outlets(id) on delete cascade,
  operator_id uuid references auth.users(id) on delete set null,
  label text not null,
  order_type text not null default 'dine_in',
  items jsonb not null default '[]'::jsonb,
  subtotal bigint not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('cash','qris','ewallet','card','wallet')),
  amount bigint not null check (amount > 0),
  reference text,
  status text not null default 'paid' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.pos_holds enable row level security;
alter table public.order_payments enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "staff manage pos holds" on public.pos_holds;
create policy "staff manage pos holds" on public.pos_holds for all to authenticated
using (operator_id = auth.uid() or public.is_staff(auth.uid()))
with check (operator_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "staff read order payments" on public.order_payments;
create policy "staff read order payments" on public.order_payments for select to authenticated
using (public.is_staff(auth.uid()));

drop policy if exists "staff read order events" on public.order_events;
create policy "staff read order events" on public.order_events for select to authenticated
using (public.is_staff(auth.uid()));

create index if not exists order_payments_order_id_idx on public.order_payments(order_id);
create index if not exists order_events_order_id_created_at_idx on public.order_events(order_id, created_at desc);
create index if not exists pos_holds_operator_updated_at_idx on public.pos_holds(operator_id, updated_at desc);

alter table public.pos_holds replica identity full;
alter table public.order_payments replica identity full;
alter table public.order_events replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.pos_holds;
  alter publication supabase_realtime add table public.order_payments;
  alter publication supabase_realtime add table public.order_events;
exception when duplicate_object then null; end $$;

create or replace function public.create_pos_order(
  p_order_type text,
  p_items jsonb,
  p_subtotal bigint,
  p_tax bigint,
  p_total bigint,
  p_payment_method text default 'cash',
  p_paid_amount bigint default 0,
  p_note text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order_id uuid;
  v_code text;
  v_item jsonb;
  v_paid bigint := greatest(coalesce(p_paid_amount, 0), 0);
begin
  if auth.uid() is null or not public.is_staff(auth.uid()) then
    raise exception 'staff authentication required';
  end if;
  if p_total <= 0 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid order';
  end if;
  if p_payment_method = 'cash' and v_paid < p_total then
    raise exception 'insufficient cash';
  end if;
  v_code := 'POS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders(order_code, customer_name, customer_phone, address, items, subtotal, total, payment_status, paid_at, kasir_id, status, metode_bayar, catatan)
  values (v_code, 'Walk-in Customer', null, null, p_items, p_subtotal, p_total, 'paid', now(), auth.uid(), 'diproses', p_payment_method, concat_ws(' · ', p_order_type, p_note))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, product_id, nama_produk, harga, qty, subtotal)
    values (v_order_id, nullif(v_item->>'product_id','')::uuid, v_item->>'name', (v_item->>'price')::bigint, (v_item->>'qty')::integer, (v_item->>'subtotal')::bigint);
  end loop;

  insert into public.order_payments(order_id, method, amount, status)
  values (v_order_id, p_payment_method, p_total, 'paid');
  insert into public.order_events(order_id, event_type, payload, actor_id)
  values (v_order_id, 'created', jsonb_build_object('order_type', p_order_type, 'tax', p_tax), auth.uid());
  return jsonb_build_object('id', v_order_id, 'order_code', v_code, 'change', v_paid - p_total);
end;
$$;

grant execute on function public.create_pos_order(text, jsonb, bigint, bigint, bigint, text, bigint, text) to authenticated;

create or replace function public.update_order_status(p_order_id uuid, p_status public.order_status, p_note text default null)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare v_order public.orders;
begin
  if auth.uid() is null or not public.is_staff(auth.uid()) then raise exception 'staff authentication required'; end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order_id returning * into v_order;
  if v_order.id is null then raise exception 'order not found'; end if;
  insert into public.order_events(order_id, event_type, payload, actor_id)
  values (p_order_id, 'status_changed', jsonb_build_object('status', p_status, 'note', p_note), auth.uid());
  return v_order;
end;
$$;

grant execute on function public.update_order_status(uuid, public.order_status, text) to authenticated;

create trigger pos_holds_updated_at before update on public.pos_holds for each row execute function public.set_updated_at();

revoke all on function public.create_pos_order(text, jsonb, bigint, bigint, bigint, text, bigint, text) from public, anon;
revoke all on function public.update_order_status(uuid, public.order_status, text) from public, anon;

notify pgrst, 'reload schema';
